const p = (title, slug, description, constraints, examples, testCases, starterCode, titleTags = ["Debugging"]) => ({
  mode: "debugging",
  title,
  slug,
  difficulty: "Easy",
  tags: titleTags,
  description,
  constraints,
  examples,
  testCases: testCases.map(([input, output, isPublic = false]) => ({ input, output, isPublic })),
  starterCode,
  isActive: true,
  solveCount: 0,
});

export const DEBUGGING_PROBLEMS_SEED = [
  p(
    "Debug: Sum of Two Numbers",
    "debug-sum-two-numbers",
    `Fix the bug and print the sum of two integers.

### Input
Two space-separated integers A B.

### Output
Print A + B.`,
    "-10^9 ≤ A, B ≤ 10^9",
    [{ input: "3 5", output: "8" }],
    [["3 5", "8", true], ["-2 7", "5"], ["10 -3", "7"]],
    {
      javascript: `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split(/\\s+/);\nconst a = Number(input[0] || 0);\nconst b = Number(input[1] || 0);\n// BUG: Subtracting instead of adding\nconsole.log(a - b);`,
      python: `import sys\ndata = sys.stdin.read().strip().split()\na = int(data[0]) if data else 0\nb = int(data[1]) if len(data) > 1 else 0\n# BUG: Subtracting instead of adding\nprint(a - b)`,
      java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        long a = sc.hasNextLong() ? sc.nextLong() : 0;\n        long b = sc.hasNextLong() ? sc.nextLong() : 0;\n        // BUG: Subtracting instead of adding\n        System.out.println(a - b);\n    }\n}`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    long long a = 0, b = 0;\n    if (!(cin >> a >> b)) return 0;\n    // BUG: Subtracting instead of adding\n    cout << a - b;\n    return 0;\n}`,
      c: `#include <stdio.h>\nint main() {\n    long long a = 0, b = 0;\n    if (scanf("%lld %lld", &a, &b) != 2) return 0;\n    // BUG: Subtracting instead of adding\n    printf("%lld", a - b);\n    return 0;\n}`
    }
  ),
  p(
    "Debug: Odd or Even",
    "debug-odd-or-even",
    `Fix the bug and print Odd if the number is odd, Even otherwise.

### Input
A single integer N.

### Output
Print Odd or Even.`,
    "1 ≤ N ≤ 10^9",
    [{ input: "4", output: "Even" }],
    [["4", "Even", true], ["7", "Odd"], ["2", "Even"]],
    {
      javascript: `const fs = require("fs");\nconst n = Number(fs.readFileSync(0, "utf8").trim());\n// BUG: incorrectly checks n % 2 === 1 for Even\nif (n % 2 === 1) {\n    console.log("Even");\n} else {\n    console.log("Odd");\n}`,
      python: `import sys\nn = int(sys.stdin.read().strip() or 0)\n# BUG: incorrectly checks n % 2 == 1 for Even\nif n % 2 == 1:\n    print("Even")\nelse:\n    print("Odd")`,
      java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNextLong()) {\n            long n = sc.nextLong();\n            // BUG: incorrectly checks n % 2 == 1 for Even\n            if (n % 2 == 1) System.out.println("Even");\n            else System.out.println("Odd");\n        }\n    }\n}`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    long long n;\n    if(cin >> n) {\n        // BUG: incorrectly checks n % 2 == 1 for Even\n        if (n % 2 == 1) cout << "Even";\n        else cout << "Odd";\n    }\n    return 0;\n}`,
      c: `#include <stdio.h>\nint main() {\n    long long n;\n    if(scanf("%lld", &n) == 1) {\n        // BUG: incorrectly checks n % 2 == 1 for Even\n        if (n % 2 == 1) printf("Even");\n        else printf("Odd");\n    }\n    return 0;\n}`
    }
  ),
  p(
    "Debug: Reverse a String",
    "debug-reverse-string",
    `Fix the bug and print the reverse of the given string.

### Input
A single word.

### Output
Reversed string.`,
    "1 ≤ |S| ≤ 1000",
    [{ input: "hello", output: "olleh" }],
    [["hello", "olleh", true], ["racecar", "racecar"], ["code", "edoc"]],
    {
      javascript: `const fs = require("fs");\nconst s = fs.readFileSync(0, "utf8").trim();\n// BUG: Not joining the array\nconsole.log(s.split("").reverse());`,
      python: `import sys\ns = sys.stdin.read().strip()\n# BUG: Slicing forward instead of backward\nprint(s[::1])`,
      java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNext()) {\n            String s = sc.next();\n            // BUG: Printing the string normally\n            System.out.println(s);\n        }\n    }\n}`,
      cpp: `#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\nint main() {\n    string s;\n    if(cin >> s) {\n        // BUG: sorting instead of reversing\n        sort(s.begin(), s.end());\n        cout << s;\n    }\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\nint main() {\n    char s[1005];\n    if(scanf("%s", s) == 1) {\n        // BUG: only printing the first character\n        printf("%c", s[0]);\n    }\n    return 0;\n}`
    }
  ),
  p(
    "Debug: Prime Check",
    "debug-prime-check",
    `Fix the bug and print YES if N is prime, NO otherwise.

### Input
A single integer N.

### Output
YES or NO.`,
    "1 ≤ N ≤ 10^6",
    [{ input: "7", output: "YES" }],
    [["7", "YES", true], ["4", "NO"], ["13", "YES"]],
    {
      javascript: `const fs = require("fs");\nconst n = Number(fs.readFileSync(0, "utf8").trim());\nlet isPrime = n > 1;\n// BUG: checks up to n but loop condition is i < n so it fails for small bugs or just completely broken logic\nfor(let i=2; i<=n; i++) {\n    if(n % i === 0) isPrime = false;\n}\nconsole.log(isPrime ? "YES" : "NO");`,
      python: `import sys\nn = int(sys.stdin.read().strip() or 0)\nis_prime = n > 1\n# BUG: divides by n\nfor i in range(2, n + 1):\n    if n % i == 0:\n        is_prime = False\nprint("YES" if is_prime else "NO")`,
      java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNextInt()) {\n            int n = sc.nextInt();\n            boolean isPrime = n > 1;\n            // BUG: divides by n itself\n            for(int i=2; i<=n; i++) {\n                if(n % i == 0) isPrime = false;\n            }\n            System.out.println(isPrime ? "YES" : "NO");\n        }\n    }\n}`,
      cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    int n;\n    if(cin >> n) {\n        bool isPrime = n > 1;\n        // BUG: loop goes up to n\n        for(int i=2; i<=n; i++) {\n            if(n % i == 0) isPrime = false;\n        }\n        cout << (isPrime ? "YES" : "NO");\n    }\n    return 0;\n}`,
      c: `#include <stdio.h>\nint main() {\n    int n;\n    if(scanf("%d", &n) == 1) {\n        int isPrime = n > 1;\n        // BUG: loop goes up to n\n        for(int i=2; i<=n; i++) {\n            if(n % i == 0) isPrime = 0;\n        }\n        if(isPrime) printf("YES"); else printf("NO");\n    }\n    return 0;\n}`
    }
  ),
  p(
    "Debug: GCD of Two Numbers",
    "debug-gcd-two-numbers",
    `Fix the bug and print the greatest common divisor of two numbers.

### Input
Two integers A B.

### Output
GCD(A, B).`,
    "1 ≤ A, B ≤ 10^9",
    [{ input: "12 8", output: "4" }],
    [["12 8", "4", true], ["100 75", "25"], ["36 48", "12"]],
    {
      javascript: `const fs = require("fs");\nconst [a, b] = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);\nfunction gcd(x, y) {\n    if (y === 0) return x;\n    // BUG: wrong order\n    return gcd(y, y % x);\n}\nconsole.log(gcd(a, b));`,
      python: `import sys\ndata = sys.stdin.read().split()\na = int(data[0]) if len(data)>0 else 0\nb = int(data[1]) if len(data)>1 else 0\ndef gcd(x, y):\n    if y == 0: return x\n    # BUG: wrong order\n    return gcd(y, y % x)\nprint(gcd(a, b))`,
      java: `import java.util.*;\npublic class Main {\n    static long gcd(long x, long y) {\n        if(y == 0) return x;\n        // BUG: wrong order\n        return gcd(y, y % x);\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        long a = sc.hasNextLong() ? sc.nextLong() : 0;\n        long b = sc.hasNextLong() ? sc.nextLong() : 0;\n        System.out.println(gcd(a, b));\n    }\n}`,
      cpp: `#include <iostream>\nusing namespace std;\nlong long gcd(long long x, long long y) {\n    if(y == 0) return x;\n    // BUG: wrong order\n    return gcd(y, y % x);\n}\nint main() {\n    long long a, b;\n    if(cin >> a >> b) cout << gcd(a, b);\n    return 0;\n}`,
      c: `#include <stdio.h>\nlong long gcd(long long x, long long y) {\n    if(y == 0) return x;\n    // BUG: wrong order\n    return gcd(y, y % x);\n}\nint main() {\n    long long a, b;\n    if(scanf("%lld %lld", &a, &b) == 2) printf("%lld", gcd(a, b));\n    return 0;\n}`
    }
  ),
  p(
    "Debug: Count Vowels",
    "debug-count-vowels",
    `Fix the bug and count vowels in the given string.

### Input
A single line string.

### Output
Count of vowels.`,
    "1 ≤ |S| ≤ 10^4",
    [{ input: "Hello World", output: "3" }],
    [["Hello World", "3", true], ["aeiou", "5"], ["Programming", "3"]],
    {
      javascript: `const fs = require("fs");\nconst s = fs.readFileSync(0, "utf8").trim();\nlet count = 0;\n// BUG: checks consonants instead of vowels\nfor(let c of s) {\n    if("bcdfghjklmnpqrstvwxyz".includes(c.toLowerCase())) count++;\n}\nconsole.log(count);`,
      python: `import sys\ns = sys.stdin.read().strip()\ncount = 0\n# BUG: checks consonants instead of vowels\nfor c in s:\n    if c.lower() in "bcdfghjklmnpqrstvwxyz":\n        count += 1\nprint(count)`,
      java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNextLine()) {\n            String s = sc.nextLine();\n            int count = 0;\n            String vowels = "aeiouAEIOU";\n            for(int i=0; i<s.length(); i++) {\n                // BUG: checks if it is NOT a vowel\n                if(vowels.indexOf(s.charAt(i)) == -1) count++;\n            }\n            System.out.println(count);\n        }\n    }\n}`,
      cpp: `#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s;\n    getline(cin, s);\n    int count = 0;\n    string vowels = "aeiouAEIOU";\n    for(char c : s) {\n        // BUG: checks if it is NOT a vowel\n        if(vowels.find(c) == string::npos) count++;\n    }\n    cout << count;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\nint main() {\n    char s[10005];\n    if(fgets(s, sizeof(s), stdin)) {\n        int count = 0;\n        // BUG: checks consonants\n        for(int i=0; s[i]; i++) {\n            char c = s[i];\n            if(c>='A' && c<='Z') c += 32;\n            if(c>='a' && c<='z' && c!='a' && c!='e' && c!='i' && c!='o' && c!='u') count++;\n        }\n        printf("%d", count);\n    }\n    return 0;\n}`
    }
  )
];
