/* eslint-disable arrow-parens */
/* eslint-disable no-unused-expressions */
/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/array-type */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable prefer-const */
/* eslint-disable curly */

import { Query, Search } from "ale-base-model/dist/models/Query";

export class MongoQueryHelper {
	public transformQuery<T>(query: Query<T>) {
		if (!query || (!query.filter && query.query && query.search)) return {};
		else {
			if (typeof query == "string") query = JSON.parse(query);
			else query = query;
		}
		let querySearchs = this.convertSeachsToQuery(
			query.search ? [query.search] : []
		);
		let queryFilter = this.converFilterToQuery(query.filter);
		return {
			$and: [query.query, querySearchs, queryFilter].filter(
				(item: any) => item != null
			),
		};
	}

	private converFilterToQuery<T>(filter: any) {
		if (!filter) return { $and: [{}] };
		let fiterQueries = Object.keys(filter).map((key) => ({
			[key]: filter[key],
		}));
		return { $and: fiterQueries };
	}

	private convertSeachsToQuery<T>(searchs: Search<T>[]) {
		let childQueries: Array<any> = new Array();
		if (
			!searchs ||
			searchs.length == 0 ||
			(searchs && searchs[0].content == "")
		)
			return { $and: [{}] };

		searchs?.map((item) => {
			if (item && typeof item == "string") {
				item = JSON.parse(item);
			}
			item.fields?.map((field: any) => {
				const query = {
					[field]: {
						$regex: item.content.replace(
							/[.*+?^${}()|[\]\\]/g,
							"\\$&"
						),
						$options: "i",
					},
				};
				childQueries.push(query);
			});
		});
		return {
			$or: childQueries,
		};
	}
}

export const mongoQueryHelper = new MongoQueryHelper();
