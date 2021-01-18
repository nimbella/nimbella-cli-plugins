/*
 * Copyright (c) 2019 - present Nimbella Corp.
 *
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import axios, { AxiosInstance } from 'axios';
import * as rax from 'retry-axios';
import { Collection } from 'postman-collection';
import logger from './logger';

/*
I don't celebrate because I'm only doing my job. When a postman delivers letters, does he celebrate?
*/

export default class PostmanFetcher {
  baseUrl = 'https://api.getpostman.com/';

  apiKey: string | undefined;

  instance: AxiosInstance;

  constructor(apiKey: string | undefined) {
    this.apiKey = apiKey;
    rax.attach();
    this.instance = axios.create({
      baseURL: this.baseUrl,
      headers: { 'X-Api-Key': this.apiKey },
    });
    rax.attach(this.instance);
  }

  getAllCollections = async (): Promise<Array<any>> => {
    let output: Array<any> = [];
    try {
      output = await (await this.instance.get(`${this.baseUrl}collections`))
        .data.collections;
    } catch (error) {
      logger.error(error);
    }
    return output;
  };

  getCollection = async (collectionId: string): Promise<object> => {
    let output: object;
    try {
      output = await (
        await this.instance.get(`${this.baseUrl}collections/${collectionId}`)
      ).data;
    } catch (error) {
      const msg = `Could not fetch the collection ${collectionId} from server! Please check if it exists.`;
      logger.warn(msg);
      throw new Error(msg);
    }
    return output;
  };

  getCollectionGuid = async (name: string): Promise<string> => {
    try {
      const collections = await this.getAllCollections();
      return collections.find(
        item => item.name.toUpperCase() === name.toUpperCase()
      ).id;
    } catch (error) {
      const msg = `Could not fetch the collection ${name} from server! Please check if it exists.`;
      console.warn(msg);
      logger.warn(error);
      throw new Error(error.message);
    }
  };

  getCollectionWithVersion = async (id: string): Promise<any> => {
    try {
      const collectionData: any = await this.getCollection(id);
      const { collection } = collectionData;
      return {
        isVersion2X: ((collection.info || '').schema || '').includes('v2'),
        collection: new Collection(collection),
      };
    } catch (error) {
      console.log(`Error getting collection ${id} from the Postman API`);
      return { isVersion2X: false, collection: undefined };
    }
  };

  getUser = async (): Promise<string> => {
    let output = '';
    try {
      output = await (await this.instance.get(`${this.baseUrl}me/`)).data;
    } catch (error) {
      logger.error(error);
    }
    return output;
  };
}
