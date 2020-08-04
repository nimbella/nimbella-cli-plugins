declare module 'openapi-to-postmanv2' {
  export class SchemaPack {
    convert(...args: any[]): void;

    getMetaData(...args: any[]): void;

    mergeAndValidate(...args: any[]): void;

    validate(...args: any[]): void;

    validateTransaction(...args: any[]): void;

    static getOptions(...args: any[]): void;
  }

  export function convert(input: any, options: any, cb: any): any;

  export function getMetaData(input: any, cb: any): void;

  export function getOptions(mode: any, criteria: any): any;

  export function mergeAndValidate(input: any, cb: any): void;

  export function validate(input: any): any;
}
