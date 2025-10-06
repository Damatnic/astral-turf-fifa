/**
 * Cross-environment runtime helpers for security modules.
 *
 * These utilities provide consistent access to cryptographic primitives
 * and text encoding APIs across browser, Node.js, and test runners.
 */

export type RandomValuesFunction = (array: Uint8Array) => Uint8Array;

interface TextEncoderLike {
  encode(input?: string): Uint8Array;
}

interface TextDecoderLike {
  decode(input?: ArrayBuffer | ArrayBufferView): string;
}

type TextEncoderCtor = new () => TextEncoderLike;
type TextDecoderCtor = new (label?: string) => TextDecoderLike;

interface BufferLike extends Uint8Array {
  toString(encoding?: string): string;
}

interface BufferConstructorLike {
  from(
    input: string | ArrayBuffer | ArrayBufferView | number[] | Uint8Array,
    encoding?: string
  ): BufferLike;
}

interface RuntimeGlobal {
  TextEncoder?: TextEncoderCtor;
  TextDecoder?: TextDecoderCtor;
  Buffer?: BufferConstructorLike;
  crypto?: {
    getRandomValues?: RandomValuesFunction;
  };
  atob?: (data: string) => string;
  btoa?: (data: string) => string;
}

const runtimeGlobal = globalThis as RuntimeGlobal;

export function encodeText(value: string): Uint8Array {
  const EncoderCtor = runtimeGlobal.TextEncoder;
  if (EncoderCtor) {
    return new EncoderCtor().encode(value);
  }

  const BufferCtor = runtimeGlobal.Buffer;
  if (BufferCtor) {
    return Uint8Array.from(BufferCtor.from(value, 'utf8'));
  }

  throw new Error('TextEncoder is not available in the current runtime');
}

export function decodeText(bytes: Uint8Array): string {
  const DecoderCtor = runtimeGlobal.TextDecoder;
  if (DecoderCtor) {
    return new DecoderCtor().decode(bytes);
  }

  const BufferCtor = runtimeGlobal.Buffer;
  if (BufferCtor) {
    return BufferCtor.from(bytes).toString('utf8');
  }

  throw new Error('TextDecoder is not available in the current runtime');
}

export function getRandomValuesProvider(): RandomValuesFunction | null {
  const crypto = runtimeGlobal.crypto;
  if (crypto?.getRandomValues) {
    return crypto.getRandomValues.bind(crypto);
  }
  return null;
}

export function getSecureRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  const provider = getRandomValuesProvider();

  if (provider) {
    provider(array);
    return array;
  }

  for (let index = 0; index < array.length; index += 1) {
    array[index] = Math.floor(Math.random() * 256);
  }

  return array;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (bytes.length === 0) {
    return '';
  }

  const BufferCtor = runtimeGlobal.Buffer;
  if (BufferCtor) {
    return BufferCtor.from(bytes).toString('base64');
  }

  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  const btoaFn = runtimeGlobal.btoa;
  if (btoaFn) {
    return btoaFn(binary);
  }

  throw new Error('Base64 encoding is not supported in this runtime');
}

export function base64ToBytes(value: string): Uint8Array {
  if (!value) {
    return new Uint8Array();
  }

  const BufferCtor = runtimeGlobal.Buffer;
  if (BufferCtor) {
    const buffer = BufferCtor.from(value, 'base64');
    return new Uint8Array(buffer);
  }

  const atobFn = runtimeGlobal.atob;
  if (atobFn) {
    const binary = atobFn(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  throw new Error('Base64 decoding is not supported in this runtime');
}

export function utf8ToBase64(value: string): string {
  return bytesToBase64(encodeText(value));
}

export function base64ToUtf8(value: string): string {
  return decodeText(base64ToBytes(value));
}

export function randomHex(length: number): string {
  return bytesToHex(getSecureRandomBytes(length));
}
