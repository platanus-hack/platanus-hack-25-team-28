/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as functions_legacy from "../functions/legacy.js";
import type * as functions_products from "../functions/products.js";
import type * as importData from "../importData.js";
import type * as jumbo from "../jumbo.js";
import type * as myFunctions from "../myFunctions.js";
import type * as products from "../products.js";
import type * as rag_agents_promptAgent from "../rag/agents/promptAgent.js";
import type * as rag_agents_selectionAgent from "../rag/agents/selectionAgent.js";
import type * as rag_embeddings from "../rag/embeddings.js";
import type * as rag_promptLoader from "../rag/promptLoader.js";
import type * as rag_providers_anthropicLlm from "../rag/providers/anthropicLlm.js";
import type * as rag_providers_openaiEmbedding from "../rag/providers/openaiEmbedding.js";
import type * as rag_providers_openaiLlm from "../rag/providers/openaiLlm.js";
import type * as rag_recommender from "../rag/recommender.js";
import type * as rag_retrieval from "../rag/retrieval.js";
import type * as rag_types from "../rag/types.js";
import type * as recommendations from "../recommendations.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "functions/legacy": typeof functions_legacy;
  "functions/products": typeof functions_products;
  importData: typeof importData;
  jumbo: typeof jumbo;
  myFunctions: typeof myFunctions;
  products: typeof products;
  "rag/agents/promptAgent": typeof rag_agents_promptAgent;
  "rag/agents/selectionAgent": typeof rag_agents_selectionAgent;
  "rag/embeddings": typeof rag_embeddings;
  "rag/promptLoader": typeof rag_promptLoader;
  "rag/providers/anthropicLlm": typeof rag_providers_anthropicLlm;
  "rag/providers/openaiEmbedding": typeof rag_providers_openaiEmbedding;
  "rag/providers/openaiLlm": typeof rag_providers_openaiLlm;
  "rag/recommender": typeof rag_recommender;
  "rag/retrieval": typeof rag_retrieval;
  "rag/types": typeof rag_types;
  recommendations: typeof recommendations;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
