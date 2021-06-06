/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/order */
/* eslint-disable no-underscore-dangle */
const DbService = require("moleculer-db");
import { FindProps, GetProps } from "ale-base-model";
import { DEFAULT_PAGE_SIZE } from "ale-base-model/dist/models/Paging";
import { Context, ServiceSchema } from "moleculer";
import { v4 as uuidv4 } from "uuid";
import { mongoQueryHelper } from "../helper/MongoQueryHelper";

const nomalizationId = (object: any) => ({ ...object, id: object._id });
const nomalizationIds = (objects: any[]) =>
	objects != null ? objects.map((obj: any) => nomalizationId(obj)) : [];

const crudMongoMixin: any = {
	name: "crud-mongo",
	mixins: [DbService],
	actions: {
		filter(ctx: Context) {
			return this._customList(ctx);
		},

		create(ctx: Context) {
			return this._customCreate(ctx);
		},

		update(ctx: Context) {
			return this._customUpdate(ctx);
		},

		remove(ctx: Context) {
			return this._customRemove(ctx);
		},

		get(ctx: Context) {
			return this._customGet(ctx);
		},
	},
	methods: {
		_customFind(ctx: Context<FindProps<any>>) {
			let { params } = ctx;
			if (ctx.service.settings.populates) {
				const populateFields = Object.keys(
					ctx.service.settings.populates
				);
				params = {
					...params,
					populate: populateFields,
				};
			}

			const limit = params.limit || 10000;
			const offset = params.offset || 0;

			const combinedQueries = mongoQueryHelper.transformQuery(params);
			params = {
				...params,
				offset,
				limit,
				query: { ...combinedQueries, isDeleted: "false" },
			};
			return this._find(ctx, params).then((pagination: any) => ({
				...pagination,
				rows: nomalizationIds(pagination.rows),
			}));
		},

		_customGet(ctx: Context<GetProps<any>>) {
			let { params } = ctx;
			params = this.sanitizeParams(ctx, ctx.params);
			if (ctx.service.settings.populates) {
				const populateFields = Object.keys(
					ctx.service.settings.populates
				);
				params = {
					...params,
					populate: populateFields,
				};
			}
			return this._get(ctx, params)
				.then((value: any) => {
					if (Array.isArray(params.id)) {
						return nomalizationIds(
							value.filter(
								(v: any) =>
									!v.isDeleted || v.isDeleted === false
							)
						);
					} else {
						if (!value.isDeleted || value.isDeleted === false) {
							return nomalizationId(value);
						} else {
							throw new Error(
								`Entity with id ${value.id} it not existed`
							);
						}
					}
				})
				.catch((error: any) => {
					throw error;
				});
		},

		_customCreate(ctx: Context<any>) {
			const { params } = ctx;
			return this._get(ctx, { ...params, _id: params.id })
				.then((value: any) => {
					const updatedValue = {
						...value,
						...params,
						id: value.id,
						_id: value._id,
						createdAt: value.createdAt || new Date(),
						updatedAt: new Date(),
						isDeleted: false,
					};
					return this._update(ctx, updatedValue).then(
						(dbUpdatedValue: any) => dbUpdatedValue
					);
				})
				.catch((error: any) => {
					delete params._id;
					const id = uuidv4();
					const newValue = {
						...params,
						_id: id,
						id,
						createdAt: new Date(),
						updatedAt: new Date(),
						isDeleted: false,
					};
					return this._create(ctx, newValue).then(
						(dbNewValue: any) => dbNewValue
					);
				});
		},

		_customUpdate(ctx: Context) {
			let params: any = ctx.params;
			params = {
				...params,
				_id: params.id,
				updatedAt: new Date(),
				isDeleted: false,
			};
			return this._update(ctx, params);
		},

		_customList(ctx: Context) {
			console.log(ctx.params);
			let params: any = ctx.params;
			if (ctx.service.settings.populates) {
				const populateFields = Object.keys(
					ctx.service.settings.populates
				);
				params = {
					...params,
					populate: populateFields,
				};
			}

			const page = params.page ? Number(params.page) : 1;
			const pageSize = params.pageSize
				? Number(params.pageSize)
				: DEFAULT_PAGE_SIZE;

			const combinedQueries = mongoQueryHelper.transformQuery(params);
			params = {
				...params,
				page,
				pageSize,
				offset: (page - 1) * pageSize,
				limit: pageSize,
				query: { ...combinedQueries, isDeleted: false },
			};
			console.log({params: JSON.stringify(params)});
			delete params.search;

			return this._list(ctx, params).then((pagination: any) => ({
				...pagination,
				rows: nomalizationIds(pagination.rows),
			}));
		},

		_customRemove(ctx: Context<any>) {
			const { params } = ctx;
			return this._get(ctx, params)
				.then((result: any) => {
					result = {
						...result,
						isDeleted: true,
					};
					return this._update(ctx, result)
						.then((resp: any) => result)
						.catch((e: any) => {
							console.log(e);
						});
				})
				.catch((error: any) => {
					throw new Error(
						`Object with ID ${ctx.params.id} is not exist`
					);
				});
		},
	},
};

export = crudMongoMixin;
