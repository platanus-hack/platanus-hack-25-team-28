/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as functions_cart from "../functions/cart.js";
import type * as functions_conversation from "../functions/conversation.js";
import type * as functions_legacy from "../functions/legacy.js";
import type * as functions_products from "../functions/products.js";
import type * as functions_recommendations from "../functions/recommendations.js";
import type * as importData from "../importData.js";
import type * as myFunctions from "../myFunctions.js";
import type * as products from "../products.js";
import type * as rag_agents_conversationAgent from "../rag/agents/conversationAgent.js";
import type * as rag_agents_promptAnalyzer from "../rag/agents/promptAnalyzer.js";
import type * as rag_agents_refinementAgent from "../rag/agents/refinementAgent.js";
import type * as rag_chains_twoStepRagChain from "../rag/chains/twoStepRagChain.js";
import type * as rag_promptLoader from "../rag/promptLoader.js";
import type * as rag_providers_openaiEmbedding from "../rag/providers/openaiEmbedding.js";
import type * as rag_providers_openaiLlm from "../rag/providers/openaiLlm.js";
import type * as rag_recommender from "../rag/recommender.js";
import type * as rag_retrieval from "../rag/retrieval.js";
import type * as rag_types from "../rag/types.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "functions/cart": typeof functions_cart;
  "functions/conversation": typeof functions_conversation;
  "functions/legacy": typeof functions_legacy;
  "functions/products": typeof functions_products;
  "functions/recommendations": typeof functions_recommendations;
  importData: typeof importData;
  myFunctions: typeof myFunctions;
  products: typeof products;
  "rag/agents/conversationAgent": typeof rag_agents_conversationAgent;
  "rag/agents/promptAnalyzer": typeof rag_agents_promptAnalyzer;
  "rag/agents/refinementAgent": typeof rag_agents_refinementAgent;
  "rag/chains/twoStepRagChain": typeof rag_chains_twoStepRagChain;
  "rag/promptLoader": typeof rag_promptLoader;
  "rag/providers/openaiEmbedding": typeof rag_providers_openaiEmbedding;
  "rag/providers/openaiLlm": typeof rag_providers_openaiLlm;
  "rag/recommender": typeof rag_recommender;
  "rag/retrieval": typeof rag_retrieval;
  "rag/types": typeof rag_types;
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
