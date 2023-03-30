/** 
 * simple wrapper for hyperclova x 
 * for a coherent interface with openai api
 */

import {
  Configuration,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
} from 'openai';
import type { AxiosPromise, AxiosInstance, AxiosRequestConfig } from 'axios';
import globalAxios from 'axios';
import { BaseAPI } from 'openai/base';
import type { RequestArgs } from 'openai/base';
import { DUMMY_BASE_URL, assertParamExists, setApiKeyToObject, setBasicAuthToObject, setBearerAuthToObject, setOAuthToObject, setSearchParams, serializeDataIfNeeded, toPathString, createRequestFunction } from 'openai/common';

type HyperclovaModelType = 'sft-alpha-hli' | string
const BASE_PATH = 'https://clops-inference.clova.ai/chatgpt'

export const HyperCLOVAApiAxiosParamCreator = function (configuration?: Configuration) {
  return {
      /**
       * 
       * @summary Creates a completion for the chat message
       * @param {CreateChatCompletionRequest} createChatCompletionRequest 
       * @param {*} [options] Override http request option.
       * @throws {RequiredError}
       */
      createChatCompletion: async (createChatCompletionRequest: CreateChatCompletionRequest, options: AxiosRequestConfig = {}): Promise<RequestArgs> => {
          // verify required parameter 'createChatCompletionRequest' is not null or undefined
          assertParamExists('createChatCompletion', 'createChatCompletionRequest', createChatCompletionRequest)
          const localVarPath = `/${createChatCompletionRequest.model}/completions`;
          // use dummy base URL string because the URL constructor only accepts absolute URLs.
          const localVarUrlObj = new URL(localVarPath, DUMMY_BASE_URL);
          let baseOptions;
          if (configuration) {
              baseOptions = configuration.baseOptions;
          }

          const localVarRequestOptions = { method: 'POST', ...baseOptions, ...options};
          const localVarHeaderParameter = {} as any;
          const localVarQueryParameter = {} as any;

          localVarHeaderParameter['Content-Type'] = 'application/json';

          setSearchParams(localVarUrlObj, localVarQueryParameter);
          let headersFromBaseOptions = baseOptions && baseOptions.headers ? baseOptions.headers : {};
          localVarRequestOptions.headers = {...localVarHeaderParameter, ...headersFromBaseOptions, ...options.headers};
          // request data swap
          // message merging... -> simple merge 
          let text = createChatCompletionRequest.messages.map(item => `${item.role}: ${item.content}`).concat("\n")
          const hcCompletionRequest = {
            text,
            max_tokens: createChatCompletionRequest.max_tokens,
            temparature: createChatCompletionRequest.temperature,
            stop_before: createChatCompletionRequest.stop
          }

          localVarRequestOptions.data = serializeDataIfNeeded(hcCompletionRequest, localVarRequestOptions, configuration)

          return {
              url: toPathString(localVarUrlObj),
              options: localVarRequestOptions,
          };
      }
  }
};

export interface HCCompletionsResponse {
  "text": string,
  "stop_reason": string
  "start_length": number;
  "input_length": number;
  "output_length": number;
  "semantic_score": number;
  "ok": boolean;
  "latency": number
}

export const HyperCLOVAApiiFp = (configuration?: Configuration) => {
  const localVarAxiosParamCreator = HyperCLOVAApiAxiosParamCreator(configuration)
  return {
    async createChatCompletion(createChatCompletionRequest: CreateChatCompletionRequest, options?: AxiosRequestConfig): Promise<(axios?: AxiosInstance, basePath?: string) => AxiosPromise<HCCompletionsResponse>> {
      const localVarAxiosArgs = await localVarAxiosParamCreator.createChatCompletion(createChatCompletionRequest, options);
      return createRequestFunction(localVarAxiosArgs, globalAxios, BASE_PATH, configuration);
    },
  }
}


export class HyperCLOVAApi extends BaseAPI {
  public async createChatCompletion(createChatCompletionRequest: CreateChatCompletionRequest, options?: AxiosRequestConfig) {
    let text = createChatCompletionRequest.messages.map(item => `${item.role}: ${item.content}`).concat("\n")
    return HyperCLOVAApiiFp(this.configuration).createChatCompletion(createChatCompletionRequest, options)
      .then((request) => request(this.axios, this.basePath))
      .then((resp) => ({
        ...resp,
        data: {
          id: "dummy",
          object: '',
          created: 0,  
          usage: {
            prompt_tokens: resp.data.input_length,
            completion_tokens: resp.data.output_length,
            total_tokens: resp.data.input_length + resp.data.output_length,
          },
          choices: [
            {message: {role: 'system', content: resp.data.text.slice(text.length)}}
          ],
          model: createChatCompletionRequest.model,

        } as CreateChatCompletionResponse
      })
    )
  }
}