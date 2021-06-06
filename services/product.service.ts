/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable max-len */
import { ServiceSchema, Context } from "moleculer";
import CrudMongoMixin from "./../src/mixin/crud.mongo.service";
const MongoDBAdapter = require("moleculer-db-adapter-mongo");

const ProductService: ServiceSchema = {
	name: "product",
	mixins: [CrudMongoMixin],
	adapter: new MongoDBAdapter("mongodb://localhost:27017/tracking"),
	collection: "product",
	settings: {},
	actions: {},
	events: {},
};

export = ProductService;
