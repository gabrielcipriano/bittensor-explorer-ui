import { isAddress } from "@polkadot/util-crypto";

import { Account } from "../model/account";
import { addRuntimeSpec } from "../utils/addRuntimeSpec";

import { decodeAddress } from "../utils/formatAddress";

export async function getAccount(network: string, address: string): Promise<Account|undefined> {
	if (!isAddress(address)) {
		return undefined;
	}

	// if the address is encoded, decode it
	const decodedAddress = decodeAddress(address);

	if (decodedAddress) {
		address = decodedAddress;
	}

	return addRuntimeSpec(
		network,
		{
			id: address,
			address,
		},
		() => "latest"
	);
}