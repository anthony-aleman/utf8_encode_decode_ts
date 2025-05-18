import './App.css'
import { useState } from 'react'

function App() {
  const [encodedInput, setEncodedInput] = useState("");
  const [decodedInput, setDecodedInput] = useState("");

  function EncodeToUTF8Bytes(source: string): Uint8Array<ArrayBuffer>{
    const sourceLength: null | number = source.length;
    let charCode: null | number;
    const utf8Codes: number[] = [];

    for (let index = 0; index < sourceLength; index++) {
      //console.log(source[index]);
      charCode = source[index].charCodeAt(0);

      //If character takes one byte
      if(charCode <= 0x007F){
        utf8Codes.push(charCode);
      }

      //If character takes two bytes
      else if (charCode >= 0x0080 && charCode <= 0x07FF) {
        const first = 0xc0 | (charCode >>> 6);
        const second = 0x80 | (charCode & 0x3f);
        utf8Codes.push(first, second);
      }
      //if High surrogate
      else if (charCode >= 0xD800 && charCode <= 0xDBFF) {
        const high = charCode;
        const low = source.charCodeAt(index + 1);

        if(low >= 0xDC00 && low <= 0xDFFF){
          const codePoint = ((high - 0xD800) << 10) + (low - 0xDC00) + 0x10000;

          const b1 = 0xF0 | (codePoint >> 18);
          const b2 = 0x80 | ((codePoint >> 12) & 0x3F);
          const b3 = 0x80 | ((codePoint >> 6) & 0x3F);
          const b4 = 0x80 | (codePoint & 0x3f);

          utf8Codes.push(b1, b2, b3, b4);
          index++;
        } 
        //Invalid Surrogate pair
        else{
          utf8Codes.push(0xEF, 0xBF, 0xBD); // replacement char
        }
      }

      //low surrogate pair
      else if(charCode >= 0xDC00 && charCode <= 0xDFFF){
        utf8Codes.push(0xEF, 0xBF, 0xBD);
      }

      else{
        const b1 = 0xe0 | (charCode >>> 12);
        const b2 = 0x80 | ((charCode >>> 6) & 0x3f);
        const b3 = 0x80 | (charCode & 0x3f);
        utf8Codes.push(b1, b2, b3);
      }
    }
    return new Uint8Array(utf8Codes);
  }

  function ToHexString(uintArray: Uint8Array<ArrayBuffer>): string{
    const hexString : string | null = Array.from(uintArray)
    .map(byte => byte.toString(16).padStart(2,'0'))
    .join(' ');
    return hexString;
  }

  function DecodeUTF8Bytes(hex: string): string{
    
    const byteStrings = hex.split(/\s+/);
    const bytes = byteStrings.map(h => parseInt(h, 16)).filter(b => !isNaN(b));

    const sourceLength: number | null = bytes.length;
    const charCodes: number[] = [];

    for (let index = 0; index < sourceLength; index++) {
      const b1 = bytes[index];

      //if Character takes One Bytes
      if(b1 <= 0x7f) {
        charCodes.push(b1); 
        index++;
      }
      //if character takes two bytes
      else if(b1 <=0xe0){
        const b2 = bytes[index + 1];
        const codePoint = ((b1 & 0x1F) << 6) | (b2 & 0x3F);
        charCodes.push(codePoint);
        index += 2;
      }

      //if character takes three bytes
      else if((b1 & 0xf0) === 0xE0 ){
        const b2 = bytes[index+1];
        const b3 = bytes[index+2];
        const codePoint = ((b1 & 0x0f) << 12 | (b2 & 0x3f) << 6 | (b3 & 0x3f));
        charCodes.push(codePoint);
        index+=3;  
      }

      else if ((b1 & 0xF8) === 0xF0) {
        const b2 = bytes[index + 1];
        const b3 = bytes[index + 2];
        const b4 = bytes[index + 3];
        const codePoint = ((b1 & 0x07) << 18) |
                          ((b2 & 0x3F) << 12) |
                          ((b3 & 0x3F) << 6) |
                          (b4 & 0x3F);
        // Push surrogate pair
        const highSurrogate = ((codePoint - 0x10000) >> 10) + 0xD800;
        const lowSurrogate = ((codePoint - 0x10000) & 0x3FF) + 0xDC00;
        charCodes.push(highSurrogate, lowSurrogate);
        index += 4;
      } else {
        charCodes.push(0xFFFD); // U+FFFD replacement character
        index += 1;
      } 
    }

    return String.fromCharCode(...charCodes);
  }

  function handleDecodedInput(event: React.ChangeEvent<HTMLTextAreaElement>){
    const newText: null | string = event.target.value;
    setDecodedInput(newText);
    setEncodedInput(ToHexString(EncodeToUTF8Bytes(newText)));
  }
  
  function handleEncodedInput(event: React.ChangeEvent<HTMLTextAreaElement>){
    const newText = event.target.value;
    setEncodedInput(newText);
    const decoded = DecodeUTF8Bytes(newText);
    console.log(decoded);
    setDecodedInput(decoded);
  }
  return (
    <>
      <h1>UTF-8 Encoder/Decoder</h1>
      <h2>UTF-8 decoded</h2>
      <textarea 
      placeholder='Type your text here...'
      value={decodedInput}
      onChange={(e) => handleDecodedInput(e)}
      style={{
        width: '100%',
        borderRadius: '5px',
        height: '125px',
        backgroundColor: '#FFFF'
      }}/>
      <h2>UTF-8 encoded</h2>
      <textarea 
      placeholder='Type your Hex String here...'
      value={encodedInput}
      onChange={(e) => handleEncodedInput(e)}
      style={{
        width: '100%',
        borderRadius: '5px',
        height: '125px',
        backgroundColor: '#FFFF'
      }}/>
    </>
  )
}

export default App
