import { ItemsConnection } from "../model/itemsConnection";
import { ItemsResponse } from "../model/itemsResponse";
import { MainSquidTransfer } from "../model/mainSquidTransfer";
import { PaginationOptions } from "../model/paginationOptions";
import { Transfer } from "../model/transfer";

import { addRuntimeSpecs } from "../utils/addRuntimeSpec";
import { extractConnectionItems } from "../utils/extractConnectionItems";

import { fetchArchive, fetchMainSquid } from "./fetchService";
import { hasSupport } from "./networksService";

export type TransfersFilter =
	{ account: { publicKey_eq: string } };

export type TransfersOrder = string | string[];

export async function getTransfers(
	network: string,
	filter: TransfersFilter,
	order: TransfersOrder = "id_DESC",
	pagination: PaginationOptions,
) {
	if(hasSupport(network, "main-squid")) {
		return getMainSquidTransfers(network, filter, order, pagination);
	}

	return {
		data: [],
		pagination: {
			offset: 0,
			limit: 0,
			hasNextPage: false,
			totalCount: 0,
		}
	};
}

/*** PRIVATE ***/

async function getMainSquidTransfers(
	network: string,
	filter: TransfersFilter,
	order: TransfersOrder = "id_DESC",
	pagination: PaginationOptions,
) {
	const after = pagination.offset === 0 ? null : pagination.offset.toString();

	const response = await fetchMainSquid<{transfersConnection: ItemsConnection<MainSquidTransfer>}>(
		network,
		`query ($first: Int!, $after: String, $filter: TransferWhereInput, $order: [TransferOrderByInput!]!) {
			transfersConnection(first: $first, after: $after, where: $filter, orderBy: $order) {
				edges {
					node {
						id
						transfer {
							amount
							blockNumber
							success
							timestamp
							extrinsicHash
							to {
								publicKey
							}
							from {
								publicKey
							}
						}
						account {
							publicKey
						}
						direction
					}
				}
				pageInfo {
					endCursor
					hasNextPage
					hasPreviousPage
					startCursor
				}
				totalCount
			}
		}`,
		{
			first: pagination.limit,
			after,
			filter,
			order,
		}
	);

	const items = extractConnectionItems(response.transfersConnection, pagination, unifyMainSquidTransfer);
	const itemsWithRuntimeSpec = await addRuntimeSpecs(network, items, () => "latest");
	const transfers = await addExtrinsicsInfo(network, itemsWithRuntimeSpec);

	return transfers;
}

async function addExtrinsicsInfo(network: string, items: ItemsResponse<Omit<Transfer, "extrinsic">>) {
	const extrinsicHashes = items.data.map((transfer) => transfer.extrinsicHash);

	const extrinsicsInfoByHash = await getArchiveExtrinsicsInfo(network, extrinsicHashes);

	return {
		...items,
		data: items.data.map(transfer => ({
			...transfer,
			extrinsic: extrinsicsInfoByHash[transfer.extrinsicHash]
		}))
	};
}

async function getArchiveExtrinsicsInfo(network: string, extrinsicHashes: string[]) {
	const response = await fetchArchive<{extrinsics: {id: string, hash: string}[]}>(
		network,
		`query($hashes: [String!], $limit: Int!) {
			extrinsics(where: { hash_in: $hashes }, limit: $limit) {
				id,
				hash
			}
		}`,
		{
			hashes: extrinsicHashes,
			limit: extrinsicHashes.length
		}
	);

	return response.extrinsics.reduce((extrinsicInfoByHash, extrinsic) => {
		extrinsicInfoByHash[extrinsic.hash] = extrinsic;
		return extrinsicInfoByHash;
	}, {} as Record<string, any>);
}

function unifyMainSquidTransfer(transfer: MainSquidTransfer): Omit<Transfer, "runtimeSpec"|"extrinsic"> {
	return {
		...transfer,
		accountPublicKey: transfer.account.publicKey,
		blockNumber: transfer.transfer.blockNumber,
		timestamp: transfer.transfer.timestamp,
		extrinsicHash: transfer.transfer.extrinsicHash,
		amount: transfer.transfer.amount,
		success: transfer.transfer.success,
		fromPublicKey: transfer.transfer.from.publicKey,
		toPublicKey: transfer.transfer.to.publicKey,
	};
}

