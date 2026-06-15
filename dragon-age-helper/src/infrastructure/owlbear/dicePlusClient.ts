import OBR from "@owlbear-rodeo/sdk";

import type { DicePlusRollEnvelope, GenericDiceRollResult } from "./owlbear-dice";

/** Identificador usado nos canais de resultado do Dice+ (`{source}/roll-result`). */
export const DICE_PLUS_SOURCE = "com.dragonagehelper";

/** 2× Vermelho + 1× Dragão — o terceiro dado é o dado de façanha. */
export const ATTRIBUTE_TEST_NOTATION =
    "1d6{Vermelho} + 1d6{Vermelho} + 1d6{Dragão}";

const IS_READY_CHANNEL = "dice-plus/isReady";
const ROLL_REQUEST_CHANNEL = "dice-plus/roll-request";
const READY_TIMEOUT_MS = 1500;
const ROLL_TIMEOUT_MS = 60_000;
const ROLL_IN_PROGRESS_PATTERN = /roll in progress/i;
const ROLL_RETRY_MAX = 10;
const ROLL_RETRY_DELAY_MS = 1500;

interface DicePlusIsReadyRequest {
    requestId: string;
    timestamp: number;
}

interface DicePlusIsReadyResponse {
    requestId: string;
    ready: true;
    timestamp: number;
}

interface DicePlusDieResult {
    value: number;
    kept?: boolean;
    diceType: string;
}

interface DicePlusDiceGroup {
    diceType: string;
    dice: DicePlusDieResult[];
}

interface DicePlusRollResultPayload {
    rollId: string;
    result: {
        totalValue: number;
        groups: DicePlusDiceGroup[];
    };
}

interface DicePlusRollErrorPayload {
    rollId: string;
    error: string;
}

function createRollId(): string {
    return `roll_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function createRequestId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function checkDicePlusReady(): Promise<boolean> {
    const requestId = createRequestId();

    return new Promise((resolve) => {
        const unsubscribe = OBR.broadcast.onMessage(IS_READY_CHANNEL, (event) => {
            const data = event.data as Partial<DicePlusIsReadyResponse>;
            if (data.ready === true && data.requestId === requestId) {
                unsubscribe();
                resolve(true);
            }
        });

        void OBR.broadcast.sendMessage(
            IS_READY_CHANNEL,
            { requestId, timestamp: Date.now() } satisfies DicePlusIsReadyRequest,
            { destination: "ALL" }
        );

        setTimeout(() => {
            unsubscribe();
            resolve(false);
        }, READY_TIMEOUT_MS);
    });
}

function mapGenericRollResult(payload: DicePlusRollResultPayload): GenericDiceRollResult {
    const diceValues: number[] = [];

    for (const group of payload.result.groups) {
        for (const die of group.dice) {
            if (die.kept === false) continue;
            diceValues.push(die.value);
        }
    }

    return {
        diceValues,
        totalValue: payload.result.totalValue,
    };
}

function mapRollResultToEnvelope(payload: DicePlusRollResultPayload): DicePlusRollEnvelope {
    const orderedD6: number[] = [];

    for (const group of payload.result.groups) {
        if (group.diceType.toLowerCase() !== "d6") continue;

        for (const die of group.dice) {
            if (die.kept === false) continue;
            orderedD6.push(die.value);
        }
    }

    if (orderedD6.length < 3) {
        throw new Error(
            `Resposta do Dice+ incompleta: esperados 3d6, recebidos ${orderedD6.length}.`
        );
    }

    return {
        orderedD6: orderedD6.slice(0, 3),
        totalValue: payload.result.totalValue,
    };
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRollInProgressError(error: unknown): boolean {
    return error instanceof Error && ROLL_IN_PROGRESS_PATTERN.test(error.message);
}

async function rollDicePlusOnce(diceNotation: string): Promise<DicePlusRollEnvelope> {
    const rollId = createRollId();
    const resultChannel = `${DICE_PLUS_SOURCE}/roll-result`;
    const errorChannel = `${DICE_PLUS_SOURCE}/roll-error`;

    return new Promise((resolve, reject) => {
        let settled = false;

        const finishResolve = (value: DicePlusRollEnvelope) => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(value);
        };

        const finishReject = (error: Error) => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(error);
        };

        const unsubscribeResult = OBR.broadcast.onMessage(resultChannel, (event) => {
            const data = event.data as DicePlusRollResultPayload;
            if (data.rollId !== rollId) return;

            try {
                finishResolve(mapRollResultToEnvelope(data));
            } catch (error) {
                finishReject(error instanceof Error ? error : new Error(String(error)));
            }
        });

        const unsubscribeError = OBR.broadcast.onMessage(errorChannel, (event) => {
            const data = event.data as DicePlusRollErrorPayload;
            if (data.rollId !== rollId) return;

            finishReject(new Error(data.error || "O Dice+ não conseguiu completar a rolagem."));
        });

        const timeoutId = setTimeout(() => {
            finishReject(new Error("Tempo esgotado aguardando resposta do Dice+."));
        }, ROLL_TIMEOUT_MS);

        function cleanup(): void {
            unsubscribeResult();
            unsubscribeError();
            clearTimeout(timeoutId);
        }

        void (async () => {
            try {
                await OBR.broadcast.sendMessage(
                    ROLL_REQUEST_CHANNEL,
                    {
                        rollId,
                        playerId: OBR.player.id,
                        playerName: await OBR.player.getName(),
                        rollTarget: "everyone",
                        diceNotation,
                        showResults: true,
                        timestamp: Date.now(),
                        source: DICE_PLUS_SOURCE,
                    },
                    { destination: "ALL" }
                );
            } catch (error) {
                finishReject(
                    error instanceof Error
                        ? error
                        : new Error("Não foi possível enviar a rolagem ao Dice+.")
                );
            }
        })();
    });
}

export async function rollDicePlus(
    diceNotation: string = ATTRIBUTE_TEST_NOTATION
): Promise<DicePlusRollEnvelope> {
    const isReady = await checkDicePlusReady();
    if (!isReady) {
        throw new Error(
            "Dice+ não está disponível. Ative a extensão Dice+ na sala e aguarde ficar pronta."
        );
    }

    for (let attempt = 0; attempt < ROLL_RETRY_MAX; attempt++) {
        try {
            return await rollDicePlusOnce(diceNotation);
        } catch (error) {
            const canRetry = isRollInProgressError(error) && attempt < ROLL_RETRY_MAX - 1;
            if (!canRetry) {
                if (isRollInProgressError(error)) {
                    throw new Error("Aguarde a rolagem anterior do Dice+ terminar e tente novamente.");
                }
                throw error;
            }
            await sleep(ROLL_RETRY_DELAY_MS);
        }
    }

    throw new Error("Aguarde a rolagem anterior do Dice+ terminar e tente novamente.");
}

async function rollDicePlusGenericOnce(diceNotation: string): Promise<GenericDiceRollResult> {
    const rollId = createRollId();
    const resultChannel = `${DICE_PLUS_SOURCE}/roll-result`;
    const errorChannel = `${DICE_PLUS_SOURCE}/roll-error`;

    return new Promise((resolve, reject) => {
        let settled = false;

        const finishResolve = (value: GenericDiceRollResult) => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(value);
        };

        const finishReject = (error: Error) => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(error);
        };

        const unsubscribeResult = OBR.broadcast.onMessage(resultChannel, (event) => {
            const data = event.data as DicePlusRollResultPayload;
            if (data.rollId !== rollId) return;

            try {
                finishResolve(mapGenericRollResult(data));
            } catch (error) {
                finishReject(error instanceof Error ? error : new Error(String(error)));
            }
        });

        const unsubscribeError = OBR.broadcast.onMessage(errorChannel, (event) => {
            const data = event.data as DicePlusRollErrorPayload;
            if (data.rollId !== rollId) return;

            finishReject(new Error(data.error || "O Dice+ não conseguiu completar a rolagem."));
        });

        const timeoutId = setTimeout(() => {
            finishReject(new Error("Tempo esgotado aguardando resposta do Dice+."));
        }, ROLL_TIMEOUT_MS);

        function cleanup(): void {
            unsubscribeResult();
            unsubscribeError();
            clearTimeout(timeoutId);
        }

        void (async () => {
            try {
                await OBR.broadcast.sendMessage(
                    ROLL_REQUEST_CHANNEL,
                    {
                        rollId,
                        playerId: OBR.player.id,
                        playerName: await OBR.player.getName(),
                        rollTarget: "everyone",
                        diceNotation,
                        showResults: true,
                        timestamp: Date.now(),
                        source: DICE_PLUS_SOURCE,
                    },
                    { destination: "ALL" }
                );
            } catch (error) {
                finishReject(
                    error instanceof Error
                        ? error
                        : new Error("Não foi possível enviar a rolagem ao Dice+.")
                );
            }
        })();
    });
}

export async function rollDicePlusGeneric(diceNotation: string): Promise<GenericDiceRollResult> {
    const isReady = await checkDicePlusReady();
    if (!isReady) {
        throw new Error(
            "Dice+ não está disponível. Ative a extensão Dice+ na sala e aguarde ficar pronta."
        );
    }

    for (let attempt = 0; attempt < ROLL_RETRY_MAX; attempt++) {
        try {
            return await rollDicePlusGenericOnce(diceNotation);
        } catch (error) {
            const canRetry = isRollInProgressError(error) && attempt < ROLL_RETRY_MAX - 1;
            if (!canRetry) {
                if (isRollInProgressError(error)) {
                    throw new Error("Aguarde a rolagem anterior do Dice+ terminar e tente novamente.");
                }
                throw error;
            }
            await sleep(ROLL_RETRY_DELAY_MS);
        }
    }

    throw new Error("Aguarde a rolagem anterior do Dice+ terminar e tente novamente.");
}
