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

declare module 'postman-collection-transformer' {
  export function convert(collection: any, options: any, callback: any): any;

  export function convertResponse(
    object: any,
    options: any,
    callback: any
  ): any;

  export function convertSingle(object: any, options: any, callback: any): any;

  export function isv1(object: any): any;

  export function isv2(object: any): any;

  export function normalize(collection: any, options: any, callback: any): any;

  export function normalizeResponse(
    response: any,
    options: any,
    callback: any
  ): any;

  export function normalizeSingle(
    object: any,
    options: any,
    callback: any
  ): any;

  export namespace util {
    const typeMap: {
      boolean: string;
      number: string;
      string: string;
    };

    function addProtocolProfileBehavior(source: any, destination: any): any;

    function authArrayToMap(entity: any, options: any): any;

    function authMapToArray(entity: any, options: any): any;

    function cleanAuth(entity: any, options: any): any;

    function cleanEmptyValue(entity: any, property: any, retainEmpty: any): any;

    function handleVars(entity: any, options: any, modifiers: any): any;

    function notLegacy(entityV1: any, type: any): any;

    function sanitizeAuthArray(entity: any, options: any): any;

    function uid(): any;

    function urlparse(u: any): any;

    function urlunparse(urlObj: any): any;

    namespace authMappersFromCurrent {
      function apikeyAuth(newParams: any): any;

      function awsSigV4(newParams: any): any;

      function basicAuth(newParams: any): any;

      function bearerAuth(newParams: any): any;

      function digestAuth(newParams: any): any;

      function hawkAuth(newParams: any): any;

      function ntlmAuth(newParams: any): any;

      function oAuth1(newParams: any): any;

      function oAuth2(newParams: any): any;
    }

    namespace authMappersFromLegacy {
      function apikeyAuth(oldParams: any): any;

      function awsSigV4(oldParams: any): any;

      function basicAuth(oldParams: any): any;

      function bearerAuth(oldParams: any): any;

      function digestAuth(oldParams: any): any;

      function hawkAuth(oldParams: any): any;

      function ntlmAuth(oldParams: any): any;

      function oAuth1(oldParams: any): any;

      function oAuth2(oldParams: any): any;
    }
  }
}
