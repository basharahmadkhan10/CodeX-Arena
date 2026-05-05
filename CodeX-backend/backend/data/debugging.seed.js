const starterCode = {
  javascript: `const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split(/\s+/);
const a = Number(input[0] || 0);
const b = Number(input[1] || 0);
console.log(a - b);`,
  python: `import sys
data = sys.stdin.read().strip().split()
a = int(data[0]) if data else 0
b = int(data[1]) if len(data) > 1 else 0
print(a - b)`,
  java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        long a = sc.hasNextLong() ? sc.nextLong() : 0;
        long b = sc.hasNextLong() ? sc.nextLong() : 0;
        System.out.println(a - b);
    }
}`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    long long a = 0, b = 0;
    if (!(cin >> a >> b)) return 0;
    cout << a - b;
    return 0;
}`,
  c: `#include <stdio.h>
int main() {
    long long a = 0, b = 0;
    if (scanf("%lld %lld", &a, &b) != 2) return 0;
    printf("%lld", a - b);
    return 0;
}`,
};

const p = (title, slug, description, constraints, examples, testCases, titleTags = ["Debugging"]) => ({
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
    [["3 5", "8", true], ["-2 7", "5"], ["10 -3", "7"]]
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
    [["4", "Even", true], ["7", "Odd"], ["2", "Even"]]
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
    [["hello", "olleh", true], ["racecar", "racecar"], ["code", "edoc"]]
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
    [["7", "YES", true], ["4", "NO"], ["13", "YES"]]
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
    [["12 8", "4", true], ["100 75", "25"], ["36 48", "12"]]
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
    [["Hello World", "3", true], ["aeiou", "5"], ["Programming", "3"]]
  ),
];
