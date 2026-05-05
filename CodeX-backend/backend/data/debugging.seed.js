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
  // --- ORIGINAL 6 PROBLEMS ---
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

  // --- NEW PROBLEMS 1 to 10: MATHEMATICS & BASIC LOGIC ---
  p(
    "Debug: Area of a Rectangle",
    "debug-area-rectangle",
    "Fix the logic to calculate the area of a rectangle given length and width.\n\n### Input\nTwo space-separated integers L W.\n\n### Output\nArea of the rectangle.",
    "1 ≤ L, W ≤ 10^4",
    [{ input: "5 4", output: "20" }],
    [["5 4", "20", true], ["10 10", "100"], ["0 5", "0"]],
    ["Math"]
  ),
  p(
    "Debug: Leap Year Finder",
    "debug-leap-year",
    "Fix the expression checking if a year is a leap year (divisible by 4, but not 100 unless divisible by 400).\n\n### Input\nA single integer Y.\n\n### Output\nPrint YES or NO.",
    "1000 ≤ Y ≤ 3000",
    [{ input: "2000", output: "YES" }],
    [["2000", "YES", true], ["1900", "NO"], ["2024", "YES"]]
  ),
  p(
    "Debug: Factorial of N",
    "debug-factorial",
    "The code structure fails on calculating N! or handles edge cases badly. Fix it.\n\n### Input\nA single integer N.\n\n### Output\nValue of N!.",
    "0 ≤ N ≤ 12",
    [{ input: "4", output: "24" }],
    [["4", "24", true], ["0", "1"], ["1", "1"]]
  ),
  p(
    "Debug: Absolute Difference",
    "debug-abs-difference",
    "Fix the absolute subtraction logic |A - B| without producing negative values.\n\n### Input\nTwo space-separated integers A and B.\n\n### Output\nAbsolute difference.",
    "-10^5 ≤ A, B ≤ 10^5",
    [{ input: "5 8", output: "3" }],
    [["5 8", "3", true], ["10 2", "8"], ["-5 -5", "0"]]
  ),
  p(
    "Debug: Print FizzBuzz Sequence",
    "debug-fizzbuzz-single",
    "Fix the conditions where multiples of both 3 and 5 output wrong terms.\n\n### Input\nA single integer N.\n\n### Output\nFizzBuzz, Fizz, Buzz, or N.",
    "1 ≤ N ≤ 100",
    [{ input: "15", output: "FizzBuzz" }],
    [["15", "FizzBuzz", true], ["9", "Fizz"], ["10", "Buzz"]]
  ),
  p(
    "Debug: Power of Two Check",
    "debug-power-of-two",
    "Fix the logic or bitwise expression to detect if a number is a perfect power of two.\n\n### Input\nAn integer N.\n\n### Output\nYES if power of 2, else NO.",
    "1 ≤ N ≤ 10^9",
    [{ input: "16", output: "YES" }],
    [["16", "YES", true], ["18", "NO"], ["1", "YES"]]
  ),
  p(
    "Debug: Celsius to Fahrenheit",
    "debug-celsius-fahrenheit",
    "Fix data precision conversion and division traps when converting Celsius to Fahrenheit.\n\n### Input\nAn integer C.\n\n### Output\nConverted value as a rounded down integer.",
    "-40 ≤ C ≤ 100",
    [{ input: "0", output: "32" }],
    [["0", "32", true], ["100", "212"], ["-40", "-40"]]
  ),
  p(
    "Debug: Perfect Number Check",
    "debug-perfect-number",
    "Fix the loop boundaries that skip tracking factors when verifying perfect numbers.\n\n### Input\nAn integer N.\n\n### Output\nYES or NO.",
    "1 ≤ N ≤ 10^4",
    [{ input: "6", output: "YES" }],
    [["6", "YES", true], ["28", "YES"], ["12", "NO"]]
  ),
  p(
    "Debug: N-th Fibonacci Number",
    "debug-nth-fibonacci",
    "Fix index tracking tracking faults in calculating the N-th Fibonacci number.\n\n### Input\nInteger N.\n\n### Output\nN-th Fibonacci number (F0=0, F1=1).",
    "0 ≤ N ≤ 30",
    [{ input: "5", output: "5" }],
    [["5", "5", true], ["0", "0"], ["1", "1"]]
  ),
  p(
    "Debug: Sum of Digits",
    "debug-sum-of-digits",
    "Fix the extraction step where zero or single digits break the cycle loops.\n\n### Input\nA single integer N.\n\n### Output\nSum of digits of N.",
    "0 ≤ N ≤ 10^9",
    [{ input: "123", output: "6" }],
    [["123", "6", true], ["505", "10"], ["0", "0"]]
  ),

  // --- NEW PROBLEMS 11 to 20: ARRAYS & SEARCHING LOGIC ---
  p(
    "Debug: Find Maximum in Array",
    "debug-find-max",
    "The code initializes values incorrectly, breaking on completely negative inputs. Fix it.\n\n### Input\nFirst line size N, next line N numbers.",
    "1 ≤ N ≤ 1000",
    [{ input: "3\n-5 -2 -9", output: "-2" }],
    [["3\n-5 -2 -9", "-2", true], ["4\n1 8 3 2", "8"], ["1\n42", "42"]],
    ["Arrays"]
  ),
  p(
    "Debug: Average of Array Elements",
    "debug-array-average",
    "Fix variable integer division dropping precision accuracy during average processing.\n\n### Input\nArray size N followed by space elements.",
    "1 ≤ N ≤ 100",
    [{ input: "4\n1 2 3 4", output: "2" }],
    [["4\n1 2 3 4", "2", true], ["3\n5 5 6", "5"], ["2\n10 20", "15"]],
    ["Arrays"]
  ),
  p(
    "Debug: Minimum Element Index",
    "debug-min-index",
    "Fix structural off-by-one errors returning 1-indexed positions instead of 0-indexed values.\n\n### Input\nSize N followed by N array items.",
    "1 ≤ N ≤ 10^4",
    [{ input: "4\n10 20 5 40", output: "2" }],
    [["4\n10 20 5 40", "2", true], ["3\n1 2 3", "0"], ["2\n99 12", "1"]],
    ["Arrays"]
  ),
  p(
    "Debug: Check Sorted Array",
    "debug-check-sorted",
    "Fix logic index handling preventing out-of-bounds exceptions on linear scans.\n\n### Input\nSize N followed by sequence values.",
    "2 ≤ N ≤ 1000",
    [{ input: "4\n1 2 5 4", output: "NO" }],
    [["4\n1 2 5 4", "NO", true], ["3\n10 20 30", "YES"], ["2\n5 5", "YES"]],
    ["Arrays"]
  ),
  p(
    "Debug: Count Occurrences",
    "debug-count-occurrences",
    "Fix match tracking variables dropping counter steps on value hits.\n\n### Input\nSize N, Target K, followed by elements list.",
    "1 ≤ N ≤ 500",
    [{ input: "5 2\n1 2 3 2 2", output: "3" }],
    [["5 2\n1 2 3 2 2", "3", true], ["3 4\n1 2 3", "0"], ["1 5\n5", "1"]],
    ["Arrays"]
  ),
  p(
    "Debug: Element Search Position",
    "debug-element-search",
    "Fix early terminal exit logic triggers failing before searching through full array items.\n\n### Input\nSize N, Target K, followed by array elements.",
    "1 ≤ N ≤ 1000",
    [{ input: "3 7\n1 4 7", output: "2" }],
    [["3 7\n1 4 7", "2", true], ["3 9\n1 2 3", "-1"], ["1 2\n2", "0"]],
    ["Arrays"]
  ),
  p(
    "Debug: Count Positive and Negative",
    "debug-count-pos-neg",
    "Fix conditional tracking loops sorting zero into negative counters incorrectly.\n\n### Input\nSize N, followed by elements entries.\n\n### Output\nSpace separated counts: Positive Negative.",
    "1 ≤ N ≤ 100",
    [{ input: "4\n0 1 -2 3", output: "2 1" }],
    [["4\n0 1 -2 3", "2 1", true], ["2\n0 0", "0 0"], ["3\n-1 -2 -3", "0 3"]],
    ["Arrays"]
  ),
  p(
    "Debug: Array Reverse In-Place",
    "debug-array-reverse",
    "Fix swap boundary conditions loops double-reversing arrays back to their initial forms.\n\n### Input\nSize N, followed by element components.\n\n### Output\nSpace-separated reversed array string.",
    "1 ≤ N ≤ 100",
    [{ input: "3\n1 2 3", output: "3 2 1" }],
    [["3\n1 2 3", "3 2 1", true], ["1\n5", "5"], ["4\n1 1 2 2", "2 2 1 1"]],
    ["Arrays"]
  ),
  p(
    "Debug: Alternate Array Elements",
    "debug-alternate-elements",
    "Fix sequence index iteration counts skipping elements at valid alternate positions.\n\n### Input\nSize N, followed by items data.\n\n### Output\nElements at indices 0, 2, 4...",
    "1 ≤ N ≤ 100",
    [{ input: "4\n10 20 30 40", output: "10 30" }],
    [["4\n10 20 30 40", "10 30", true], ["1\n5", "5"], ["2\n1 2", "1"]],
    ["Arrays"]
  ),
  p(
    "Debug: Double Array Elements",
    "debug-double-elements",
    "Fix tracking logic pointers mapping loops reading items outside allocation memory blocks.\n\n### Input\nSize N, then array elements list.\n\n### Output\nEach item multiplied by 2 separated by space.",
    "1 ≤ N ≤ 100",
    [{ input: "3\n1 2 3", output: "2 4 6" }],
    [["3\n1 2 3", "2 4 6", true], ["2\n0 10", "0 20"], ["1\n-1", "-2"]],
    ["Arrays"]
  ),

  // --- NEW PROBLEMS 21 to 30: STRING MANIPULATION ---
  p(
    "Debug: Palindrome String",
    "debug-palindrome-string",
    "Fix edge comparisons string handling missing symmetry markers on bounding letters.\n\n### Input\nA single word S.\n\n### Output\nYES or NO.",
    "1 ≤ |S| ≤ 100",
    [{ input: "aba", output: "YES" }],
    [["aba", "YES", true], ["abc", "NO"], ["a", "YES"]],
    ["Strings"]
  ),
  p(
    "Debug: Character Frequency",
    "debug-char-frequency",
    "Fix data character filter checks matching spaces rather than real target chars.\n\n### Input\nA word S followed by check character C.\n\n### Output\nFrequency count total.",
    "1 ≤ |S| ≤ 1000",
    [{ input: "hello l", output: "2" }],
    [["hello l", "2", true], ["test t", "2"], ["abc z", "0"]],
    ["Strings"]
  ),
  p(
    "Debug: Remove Vowels",
    "debug-remove-vowels",
    "Fix string building structures filtering lower-case but dropping uppercase vowels.\n\n### Input\nA single string line phrase.\n\n### Output\nString completely clear of vowels.",
    "1 ≤ |S| ≤ 500",
    [{ input: "Apple", output: "ppl" }],
    [["Apple", "ppl", true], ["BCD", "BCD"], ["aeiou", ""]],
    ["Strings"]
  ),
  p(
    "Debug: Concatenate First and Last",
    "debug-concat-ends",
    "Fix string slicing indices boundaries crashing scripts during single-character evaluations.\n\n### Input\nA string word S.\n\n### Output\nString formed by the first and last letters.",
    "1 ≤ |S| ≤ 100",
    [{ input: "code", output: "ce" }],
    [["code", "ce", true], ["a", "aa"], ["xyz", "xz"]],
    ["Strings"]
  ),
  p(
    "Debug: Toggle Case",
    "debug-toggle-case",
    "Fix bit math logic converting and masking numeric characters into symbol errors.\n\n### Input\nA target text S.\n\n### Output\nToggled text conversion result.",
    "1 ≤ |S| ≤ 200",
    [{ input: "aBc", output: "AbC" }],
    [["aBc", "AbC", true], ["HELLO", "hello"], ["123", "123"]],
    ["Strings"]
  ),
  p(
    "Debug: Substring Verification",
    "debug-substring-verify",
    "Fix internal library scans resolving raw pointers rather than clear conditional boolean evaluations.\n\n### Input\nTwo string entries: Main context text, and Query match target.\n\n### Output\nYES if matched, else NO.",
    "1 ≤ Lengths ≤ 500",
    [{ input: "applepie\npie", output: "YES" }],
    [["applepie\npie", "YES", true], ["hello\nworld", "NO"], ["test\nte", "YES"]],
    ["Strings"]
  ),
  p(
    "Debug: Find Longest Word Length",
    "debug-longest-word",
    "Fix loop trackers dropping calculations on final items without space borders.\n\n### Input\nSpace-separated string words sentence line.\n\n### Output\nLength of the longest word found.",
    "1 ≤ |S| ≤ 10^4",
    [{ input: "I love programming", output: "11" }],
    [["I love programming", "11", true], ["one two", "3"], ["alone", "5"]],
    ["Strings"]
  ),
  p(
    "Debug: Mask Trailing Digits",
    "debug-mask-digits",
    "Fix indexing loop shifts over-writing protected characters at string boundaries.\n\n### Input\nString sequence numbers.\n\n### Output\nAll but final 2 digits transformed into '#' symbols.",
    "2 ≤ |S| ≤ 50",
    [{ input: "12345", output: "###45" }],
    [["12345", "###45", true], ["99", "99"], ["000", "#00"]],
    ["Strings"]
  ),
  p(
    "Debug: String Length Even or Odd",
    "debug-string-len-parity",
    "Fix loops tracking empty delimiters incorrectly reporting string metadata parities.\n\n### Input\nA text word S.\n\n### Output\nEVEN or ODD matching text size state.",
    "1 ≤ |S| ≤ 100",
    [{ input: "abcd", output: "EVEN" }],
    [["abcd", "EVEN", true], ["abc", "ODD"], ["", "EVEN"]],
    ["Strings"]
  ),
  p(
    "Debug: Duplicate Character Strip",
    "debug-strip-duplicates",
    "Fix set generation processes parsing arrays losing string tracking sequences.\n\n### Input\nAn input string S.\n\n### Output\nUnique characters ordered by first appearance.",
    "1 ≤ |S| ≤ 1000",
    [{ input: "book", output: "bok" }],
    [["book", "bok", true], ["aaaa", "a"], ["abc", "abc"]],
    ["Strings"]
  ),

  // --- NEW PROBLEMS 31 to 40: BASIC ALGORITHMS & ALGEBRA ---
  p(
    "Debug: Linear Equations Solver",
    "debug-linear-solver",
    "Fix expression divisions throwing unchecked exceptions on equation forms.\n\n### Input\nValues A and B for equation Ax + B = 0.\n\n### Output\nInteger value of x (rounded down).",
    "A != 0, -10^4 ≤ B ≤ 10^4",
    [{ input: "2 -4", output: "2" }],
    [["2 -4", "2", true], ["5 0", "0"], ["-3 9", "3"]],
    ["Algorithms"]
  ),
  p(
    "Debug: Percentage Score Tracker",
    "debug-percentage-tracker",
    "Fix scaling truncation logic dropping scores before multiplier updates execute.\n\n### Input\nScore value O and maximum value T.\n\n### Output\nPercentage tracking value as an integer.",
    "1 ≤ O ≤ T ≤ 1000",
    [{ input: "4 5", output: "80" }],
    [["4 5", "80", true], ["1 2", "50"], ["3 10", "30"]],
    ["Algorithms"]
  ),
  p(
    "Debug: Multiples in Range",
    "debug-multiples-range",
    "Fix iteration condition loops ignoring matches matching exact high borders.\n\n### Input\nRange Low L, High H, and target Divisor D.\n\n### Output\nCount of valid matching values.",
    "1 ≤ L ≤ H ≤ 1000",
    [{ input: "1 10 3", output: "3" }],
    [["1 10 3", "3", true], ["5 5 5", "1"], ["10 20 7", "2"]],
    ["Algorithms"]
  ),
  p(
    "Debug: Swap Without Temp Variable",
    "debug-swap-no-temp",
    "Fix mathematical variable swapping updates dropping tracking states down to 0.\n\n### Input\nTwo integers A and B.\n\n### Output\nSwapped tracking values B and A.",
    "-10^4 ≤ A, B ≤ 10^4",
    [{ input: "5 9", output: "9 5" }],
    [["5 9", "9 5", true], ["0 10", "10 0"], ["-3 -2", "-2 -3"]],
    ["Algorithms"]
  ),
  p(
    "Debug: Sum of Matrix Diagonals",
    "debug-matrix-diagonal",
    "Fix iteration tracker arrays double counting intersect targets on matrix lookups.\n\n### Input\nGrid size N, followed by matrix rows data.\n\n### Output\nSum of primary diagonal matrix components.",
    "1 ≤ N ≤ 50",
    [{ input: "2\n1 2\n3 4", output: "5" }],
    [["2\n1 2\n3 4", "5", true], ["1\n9", "9"], ["3\n1 0 0\n0 1 0\n0 0 1", "3"]],
    ["Algorithms"]
  ),
  p(
    "Debug: LCM Calculation",
    "debug-lcm-two",
    "Fix integer type bounds storage spilling values over size restrictions before factoring.\n\n### Input\nTwo space-separated integers A and B.\n\n### Output\nLeast Common Multiple.",
    "1 ≤ A, B ≤ 10^5",
    [{ input: "4 6", output: "12" }],
    [["4 6", "12", true], ["5 7", "35"], ["10 10", "10"]],
    ["Algorithms"]
  ),
  p(
    "Debug: Count Square Numbers",
    "debug-count-squares",
    "Fix floating precision tracking casting errors inside math formula ranges.\n\n### Input\nUpper limit condition value N.\n\n### Output\nCount of perfect square numbers between 1 and N.",
    "1 ≤ N ≤ 10^6",
    [{ input: "10", output: "3" }],
    [["10", "3", true], ["1", "1"], ["25", "5"]],
    ["Algorithms"]
  ),
  p(
    "Debug: Power Calculator",
    "debug-power-calc",
    "Fix loops multiplying indices initializing targets by zero value base multipliers.\n\n### Input\nBase number B and exponent power E.\n\n### Output\nValue of B raised to power E.",
    "1 ≤ B ≤ 20, 0 ≤ E ≤ 10",
    [{ input: "2 3", output: "8" }],
    [["2 3", "8", true], ["5 0", "1"], ["10 2", "100"]],
    ["Algorithms"]
  ),
  p(
    "Debug: Arithmetic Progression Term",
    "debug-ap-term",
    "Fix off-by-one mapping loops calculating sequences offsets on indexed collections.\n\n### Input\nInitial term A, common step difference D, target term index N.\n\n### Output\nValue calculated at position N.",
    "1 ≤ A, D, N ≤ 1000",
    [{ input: "2 3 4", output: "11" }],
    [["2 3 4", "11", true], ["5 2 1", "5"], ["1 1 10", "10"]],
    ["Algorithms"]
  ),
  p(
    "Debug: Binary Search Deadlock",
    "debug-binary-deadlock",
    "Fix middle-pointer assignment steps locking processes inside endless tracking conditions.\n\n### Input\nSize N, Target Item K, followed by sorted array inputs.\n\n### Output\nIndex positions if matched, else -1.",
    "1 ≤ N ≤ 1000",
    [{ input: "4 3\n1 2 3 4", output: "2" }],
    [["4 3\n1 2 3 4", "2", true], ["3 5\n1 2 3", "-1"], ["1 10\n10", "0"]],
    ["Algorithms"]
  ),

  // --- NEW PROBLEMS 41 to 50: ADVANCED CONCEPTS & SYSTEMS ---
  p(
    "Debug: Valid Brackets Verification",
    "debug-valid-brackets",
    "Fix parsing loops accessing item pointers on empty memory stack frames.\n\n### Input\nString brackets expression configuration sequence.\n\n### Output\nYES if correctly balanced, NO otherwise.",
    "1 ≤ |S| ≤ 100",
    [{ input: "(())", output: "YES" }],
    [["(())", "YES", true], ["(()", "NO"], [")(", "NO"]],
    ["Data Structures"]
  ),
  p(
    "Debug: Hexadecimal Converter",
    "debug-hex-converter",
    "Fix mapping structures indexing string arrays throwing shift formatting characters.\n\n### Input\nBase decimal format code value N.\n\n### Output\nUpper-case Hexadecimal configuration text string.",
    "0 ≤ N ≤ 10^5",
    [{ input: "255", output: "FF" }],
    [["255", "FF", true], ["10", "A"], ["0", "0"]],
    ["Data Structures"]
  ),
  p(
    "Debug: Single Number Finder",
    "debug-single-number",
    "Fix array element comparison loops failing unique isolation bit tracks.\n\n### Input\nSize array N (always odd value), followed by sequence numbers.\n\n### Output\nThe isolated element appearing only once.",
    "1 ≤ N ≤ 1001",
    [{ input: "3\n2 2 1", output: "1" }],
    [["3\n2 2 1", "1", true], ["5\n4 1 2 1 2", "4"], ["1\n9", "9"]],
    ["Data Structures"]
  ),
  p(
    "Debug: Merge Sorted Arrays",
    "debug-merge-sorted",
    "Fix loop index bounds pointer updates ignoring elements left during final tail additions.\n\n### Input\nSizes N M, followed by individual sorted elements entries lists.\n\n### Output\nCombined single space-separated sorted list results.",
    "1 ≤ N, M ≤ 500",
    [{ input: "2 2\n1 3\n2 4", output: "1 2 3 4" }],
    [["2 2\n1 3\n2 4", "1 2 3 4", true], ["1 1\n5\n5", "5 5"], ["2 1\n1 10\n2", "1 2 10"]],
    ["Data Structures"]
  ),
  p(
    "Debug: Intersection Matrix Tracker",
    "debug-array-intersection",
    "Fix internal match verification logic outputting cross records duplicate records.\n\n### Input\nSizes N M, followed by values elements arrays paths data.\n\n### Output\nSorted space-separated shared single distinct components list.",
    "1 ≤ N, M ≤ 100",
    [{ input: "3 2\n1 2 3\n2 3", output: "2 3" }],
    [["3 2\n1 2 3\n2 3", "2 3", true], ["2 2\n1 2\n3 4", ""], ["1 1\n5\n5", "5"]],
    ["Data Structures"]
  ),
  p(
    "Debug: Remove Vector Matches",
    "debug-remove-element",
    "Fix indexing track shifts dynamic collection loops drop targets during element removals.\n\n### Input\nSize N, Target Value K, followed by element values.\n\n### Output\nFiltered clean matching collection size count tracking length.",
    "1 ≤ N ≤ 100",
    [{ input: "4 2\n2 2 3 4", output: "2" }],
    [["4 2\n2 2 3 4", "2", true], ["3 1\n1 1 1", "0"], ["2 5\n1 2", "2"]],
    ["Data Structures"]
  ),
  p(
    "Debug: Find Missing Progression Item",
    "debug-missing-number",
    "Fix index tracking steps computing formula sums over bounded ranges.\n\n### Input\nExpected sequence array limit dimension N, followed by N-1 input values.\n\n### Output\nThe single missing target progression index item.",
    "2 ≤ N ≤ 10^4",
    [{ input: "3\n1 3", output: "2" }],
    [["3\n1 3", "2", true], ["2\n2", "1"], ["4\n1 2 4", "3"]],
    ["Data Structures"]
  ),
  p(
    "Debug: String Compression System",
    "debug-string-compression",
    "Fix condition verification lookups skipping updates on terminal trailing characters blocks.\n\n### Input\nTarget string evaluation text data S.\n\n### Output\nAlpha data compression run length character totals map output.",
    "1 ≤ |S| ≤ 100",
    [{ input: "aab", output: "a2b1" }],
    [["aab", "a2b1", true], ["aaa", "a3"], ["abcd", "a1b1c1d1"]],
    ["Data Structures"]
  ),
  p(
    "Debug: Continuous Subarray Max Sum",
    "debug-max-subarray",
    "Fix sequence trackers reset calculations failing completely negative context item blocks.\n\n### Input\nSize array N, followed by item element properties entries.\n\n### Output\nMaximum window sequence value aggregate total sum.",
    "1 ≤ N ≤ 10^4",
    [{ input: "4\n-1 -2 3 -1", output: "3" }],
    [["4\n-1 -2 3 -1", "3", true], ["3\n-2 -1 -3", "-1"], ["2\n2 3", "5"]],
    ["Data Structures"]
  ),
  p(
    "Debug: Pascal's Triangle Row Index",
    "debug-pascal-row",
    "Fix mathematical loop integer products scaling out of limits bounds data type allocations.\n\n### Input\nTriangle row extraction index value parameter N.\n\n### Output\nSpace-separated values representing row parameters sequences text.",
    "0 ≤ N ≤ 20",
    [{ input: "3", output: "1 3 3 1" }],
    [["3", "1 3 3 1", true], ["0", "1"], ["1", "1 1"]],
    ["Data Structures"]
  )
];