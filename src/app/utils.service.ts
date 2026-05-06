import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {


  issueStatustable = [
    { status: 'Open (Waiting for review)', value: 1 },
    { status: 'Fix In Progress', value: 2 },
    { status: 'Fixed', value: 3 },
    { status: 'Won\'t Fix', value: 4 }
  ];

  severitytable = [
    { name: 'Critical', value: 1 },
    { name: 'High', value: 2 },
    { name: 'Medium', value: 3 },
    { name: 'Low', value: 4 },
    { name: 'Info', value: 5 }
  ];

  constructor() { }


  setseverity(severity: string): string {

    if (severity === "5") {
      severity = "Info";
    } else if (severity === "4") {
      severity = "Low";
    } else if (severity === "3") {
      severity = "Medium";
    } else if (severity === "2") {
      severity = "High";
    } else if (severity === "1") {
      severity = "Critical";
    }

    return severity;
  }


  generatePassword(length: number): string {
    const lower   = 'abcdefghijklmnopqrstuvwxyz';
    const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numeric = '0123456789';
    const special = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    const all     = lower + upper + numeric + special;

    // Rejection-sampling pick: avoids modulo bias
    const pick = (charset: string): string => {
      const limit = 256 - (256 % charset.length);
      let b: number;
      do { b = crypto.getRandomValues(new Uint8Array(1))[0]; } while (b >= limit);
      return charset[b % charset.length];
    };

    // Guarantee at least one char from each category
    const chars: string[] = [pick(lower), pick(upper), pick(numeric), pick(special)];
    while (chars.length < length) { chars.push(pick(all)); }

    // Fisher-Yates shuffle using crypto (rejection sampling to avoid modulo bias)
    for (let i = chars.length - 1; i > 0; i--) {
      const range = i + 1;
      const limit = 256 - (256 % range);
      let r: number;
      do { r = crypto.getRandomValues(new Uint8Array(1))[0]; } while (r >= limit);
      const j = r % range;
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.slice(0, length).join('');
  }



  parseCSV(str: string) {

    const arr: any = [];
    let quote = false;  // 'true' means we're inside a quoted field

    // Iterate over each character, keep track of current row and column (of the returned array)
    for (let row = 0, col = 0, c = 0; c < str.length; c++) {
      let cc = str[c], nc = str[c + 1];        // Current character, next character
      arr[row] = arr[row] || [];             // Create a new row if necessary
      arr[row][col] = arr[row][col] || '';   // Create a new column (start with empty string) if necessary

      // If the current character is a quotation mark, and we're inside a
      // quoted field, and the next character is also a quotation mark,
      // add a quotation mark to the current column and skip the next character
      if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }

      // If it's just one quotation mark, begin/end quoted field
      if (cc == '"') { quote = !quote; continue; }

      // If it's a comma and we're not in a quoted field, move on to the next column
      if (cc == ',' && !quote) { ++col; continue; }

      // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
      // and move on to the next row and move to column 0 of that new row
      if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }

      // If it's a newline (LF or CR) and we're not in a quoted field,
      // move on to the next row and move to column 0 of that new row
      if (cc == '\n' && !quote) { ++row; col = 0; continue; }
      if (cc == '\r' && !quote) { ++row; col = 0; continue; }

      // Otherwise, append the current character to the current column
      arr[row][col] += cc;
    }
    return arr;
  }

  removeHTMLTags(htmlString: string) {
    // Create a new DOMParser instance
    const parser = new DOMParser();
    // Parse the HTML string
    const doc = parser.parseFromString(htmlString, 'text/html');
    // Extract text content
    const textContent = doc.body.textContent || "";
    // Trim whitespace
    return textContent.trim();
  }

}
