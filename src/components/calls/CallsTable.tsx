import { Call } from "../../model/call";
import { PaginatedResource } from "../../model/paginatedResource";

import { AccountAddress } from "../AccountAddress";
import { ButtonLink } from "../ButtonLink";
import { ItemsTable, ItemsTableAttribute } from "../ItemsTable";
import { Link } from "../Link";

export type CallsTableProps = {
	network: string;
	calls: PaginatedResource<Call>;
};

const CallsTableAttribute = ItemsTableAttribute<Call>;

export const CallsTable = (props: CallsTableProps) => {
	const { network, calls } = props;

	return (
		<ItemsTable
			data={calls.data}
			loading={calls.loading}
			notFound={calls.notFound}
			notFoundMessage="No calls found"
			error={calls.error}
			pagination={calls.pagination}
			data-test="calls-table"
		>
			<CallsTableAttribute
				label="ID"
				render={(call) =>
					<Link to={`/${network}/call/${call.id}`}>
						{call.id}
					</Link>
				}
			/>
			<CallsTableAttribute
				label="Name"
				render={(call) =>
					<ButtonLink
						to={`/${network}/search?query=${call.name}`}
						size="small"
						color="secondary"
					>
						{call.name}
					</ButtonLink>
				}
			/>
			<CallsTableAttribute
				label="Sender"
				render={(call) =>
					call.origin && call.origin.value.__kind !== "None" && (
						<AccountAddress
							network={network}
							address={call.origin.value.value}
							prefix={call.runtimeSpec.metadata.ss58Prefix}
							shorten
						/>
					)
				}
			/>
			<CallsTableAttribute
				label="Extrinsic"
				render={(call) =>
					<Link to={`/${network}/extrinsic/${call.extrinsic.id}`}>
						{call.extrinsic.id}
					</Link>
				}
			/>
		</ItemsTable>
	);
};