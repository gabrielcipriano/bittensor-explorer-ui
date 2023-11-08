import { DataError } from "../utils/error";

export type Validator = {
	id: string;
	timestamp: string;
	height: bigint;
	amount: bigint;
	nominators: bigint;
	rank: bigint;
	address: string;
	name?: string;
	amount_day_change?: bigint;
	nominators_day_change?: bigint;
};

export type ValidatorStakeHistory = {
	amount: bigint;
	nominators: bigint;
	rank: bigint;
	timestamp: string;
};

export type ValidatorStakeHistoryPaginatedResponse = {
	hasNextPage: boolean;
	endCursor: string;
	data: ValidatorStakeHistory[];
};

export type ValidatorStakeHistoryResponse = {
	loading: boolean;
	error?: DataError;
	data: ValidatorStakeHistory[];
};