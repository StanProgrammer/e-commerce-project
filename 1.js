class Solution {
    // Function to encode a list of strings to a single string.
    encode(strs) {
        let res = "";
        for (let s of strs) {
            // Store length of string + a delimiter + the string itself
            res += s.length + "#" + s;
        }
        console.log(res)
        return res;
    }

    // Function to decode a single string to a list of strings.
    decode(s) {
        let res = [];
        let i = 0;
        
        while (i < s.length) {
            let j = i;
            // Find the delimiter to know where the length number ends
            while (s[j] !== '#') {
                j++;
            }
            
            // Get the length of the next string
            let length = parseInt(s.substring(i, j));
            
            // Move i to the start of the actual string
            i = j + 1;
            
            // Extract the string based on the length we found
            res.push(s.substring(i, i + length));
            
            // Move i to the start of the next length prefix
            i += length;
        }
        
        return res;
    }
}

let s = new Solution();
    let encoded = s.encode(["hello#", "world"]);
console.log(encoded);
let decoded = s.decode(encoded);
console.log(decoded);