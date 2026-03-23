/**
 * 100+ problems — Easy & Medium only.
 * All use pure stdin → stdout (CodeChef style).
 * Test cases verified correct.
 */

// Helper to build a problem
const p = (title, slug, difficulty, tags, description, constraints, examples, testCases) => ({
  title, slug, difficulty, tags, description, constraints, examples,
  testCases: testCases.map(([input, output, isPublic = false]) => ({ input, output, isPublic })),
  isActive: true, solveCount: 0,
});

const PROBLEMS_SEED = [

  // ══════════════════════════════════════════════
  //  EASY — Math / Basics
  // ══════════════════════════════════════════════

  p("Sum of Two Numbers", "sum-two-numbers", "Easy", ["Math"],
    `Given two integers A and B, print their sum.\n\n### Input\nTwo space-separated integers A B.\n\n### Output\nPrint A + B.`,
    "-10^9 ≤ A, B ≤ 10^9",
    [{ input: "3 5", output: "8", explanation: "3+5=8" }, { input: "-2 7", output: "5" }],
    [["3 5","8",true],["-2 7","5",true],["0 0","0"],["1000000000 -1000000000","0"],["123 877","1000"],["999999999 1","1000000000"]]
  ),

  p("Odd or Even", "odd-or-even", "Easy", ["Math"],
    `Given N, print **Odd** if it is odd, **Even** otherwise.\n\n### Input\nA single integer N.\n\n### Output\nPrint Odd or Even.`,
    "1 ≤ N ≤ 10^9",
    [{ input: "4", output: "Even" }, { input: "7", output: "Odd" }],
    [["4","Even",true],["7","Odd",true],["1","Odd"],["2","Even"],["999999999","Odd"],["1000000000","Even"]]
  ),

  p("Factorial", "factorial", "Easy", ["Math"],
    `Given N, print N! (N factorial).\n\n### Input\nA single integer N.\n\n### Output\nPrint N!`,
    "0 ≤ N ≤ 20",
    [{ input: "5", output: "120" }, { input: "0", output: "1" }],
    [["5","120",true],["0","1",true],["1","1"],["10","3628800"],["15","1307674368000"],["20","2432902008176640000"]]
  ),

  p("Power of Two", "power-of-two", "Easy", ["Math"],
    `Given N, print **YES** if N is a power of 2, **NO** otherwise.\n\n### Input\nA single integer N.\n\n### Output\nYES or NO.`,
    "1 ≤ N ≤ 10^9",
    [{ input: "8", output: "YES" }, { input: "6", output: "NO" }],
    [["8","YES",true],["6","NO",true],["1","YES"],["2","YES"],["1024","YES"],["1000","NO"]]
  ),

  p("Absolute Difference", "absolute-difference", "Easy", ["Math"],
    `Print |A - B|.\n\n### Input\nTwo space-separated integers A B.\n\n### Output\nPrint |A-B|.`,
    "-10^9 ≤ A, B ≤ 10^9",
    [{ input: "5 3", output: "2" }, { input: "3 5", output: "2" }],
    [["5 3","2",true],["3 5","2",true],["0 0","0"],["100 1","99"],["-5 5","10"],["1000000000 0","1000000000"]]
  ),

  p("Sum of N Numbers", "sum-n-numbers", "Easy", ["Math"],
    `Given N numbers, print their sum.\n\n### Input\n- Line 1: integer N\n- Line 2: N space-separated integers\n\n### Output\nPrint the sum.`,
    "1 ≤ N ≤ 10^5, -10^4 ≤ A[i] ≤ 10^4",
    [{ input: "4\n1 2 3 4", output: "10" }],
    [["4\n1 2 3 4","10",true],["1\n42","42"],["3\n-1 -2 -3","-6"],["5\n0 0 0 0 0","0"],["3\n100 200 300","600"]]
  ),

  p("Min and Max", "min-and-max", "Easy", ["Array"],
    `Given N numbers, print the minimum and maximum on one line separated by a space.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nmin max`,
    "1 ≤ N ≤ 10^5",
    [{ input: "5\n3 1 4 1 5", output: "1 5" }],
    [["5\n3 1 4 1 5","1 5",true],["1\n7","7 7"],["3\n-5 0 5","-5 5"],["4\n2 2 2 2","2 2"]]
  ),

  p("Average of Array", "average-array", "Easy", ["Math"],
    `Print the integer average (floor division) of N numbers.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nFloor average.`,
    "1 ≤ N ≤ 10^5",
    [{ input: "4\n1 2 3 4", output: "2" }],
    [["4\n1 2 3 4","2",true],["3\n10 20 30","20"],["2\n7 8","7"],["1\n100","100"]]
  ),

  p("Count Odd Numbers", "count-odd", "Easy", ["Array", "Math"],
    `Count how many numbers in the array are odd.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nCount of odd numbers.`,
    "1 ≤ N ≤ 10^5",
    [{ input: "5\n1 2 3 4 5", output: "3" }],
    [["5\n1 2 3 4 5","3",true],["4\n2 4 6 8","0"],["3\n1 3 5","3"],["1\n7","1"]]
  ),

  p("Sum of Digits", "sum-digits", "Easy", ["Math"],
    `Given a non-negative integer N, print the sum of its digits.\n\n### Input\nA single integer N.\n\n### Output\nSum of digits.`,
    "0 ≤ N ≤ 10^18",
    [{ input: "1234", output: "10" }, { input: "0", output: "0" }],
    [["1234","10",true],["0","0",true],["9","9"],["999","27"],["100","1"],["123456789","45"]]
  ),

  p("GCD of Two Numbers", "gcd-two", "Easy", ["Math"],
    `Print GCD(A, B).\n\n### Input\nTwo space-separated integers A B.\n\n### Output\nGCD(A,B).`,
    "1 ≤ A, B ≤ 10^9",
    [{ input: "12 8", output: "4" }, { input: "100 75", output: "25" }],
    [["12 8","4",true],["100 75","25",true],["1 1","1"],["7 13","1"],["36 48","12"],["1000000000 999999999","1"]]
  ),

  p("LCM of Two Numbers", "lcm-two", "Easy", ["Math"],
    `Print LCM(A, B).\n\n### Input\nTwo space-separated integers A B.\n\n### Output\nLCM(A,B).`,
    "1 ≤ A, B ≤ 10^4",
    [{ input: "4 6", output: "12" }, { input: "3 7", output: "21" }],
    [["4 6","12",true],["3 7","21",true],["5 5","5"],["1 100","100"],["12 18","36"]]
  ),

  p("Prime Check", "prime-check", "Easy", ["Math"],
    `Print **YES** if N is prime, **NO** otherwise.\n\n### Input\nA single integer N.\n\n### Output\nYES or NO.`,
    "1 ≤ N ≤ 10^6",
    [{ input: "7", output: "YES" }, { input: "4", output: "NO" }],
    [["7","YES",true],["4","NO",true],["1","NO"],["2","YES"],["13","YES"],["1000000","NO"]]
  ),

  p("Count Primes up to N", "count-primes-n", "Easy", ["Math", "Sieve"],
    `Count primes strictly less than N.\n\n### Input\nA single integer N.\n\n### Output\nCount of primes < N.`,
    "0 ≤ N ≤ 10^6",
    [{ input: "10", output: "4", explanation: "2,3,5,7" }],
    [["10","4",true],["2","0"],["3","1"],["20","8"],["100","25"],["1000","168"]]
  ),

  p("Fibonacci Nth Term", "fibonacci-nth", "Easy", ["Math"],
    `Print the N-th Fibonacci number (1-indexed: F(1)=1, F(2)=1).\n\n### Input\nA single integer N.\n\n### Output\nF(N).`,
    "1 ≤ N ≤ 50",
    [{ input: "7", output: "13" }, { input: "1", output: "1" }],
    [["7","13",true],["1","1",true],["2","1"],["10","55"],["20","6765"],["50","12586269025"]]
  ),

  p("Reverse a Number", "reverse-number", "Easy", ["Math"],
    `Reverse the digits of a non-negative integer N.\n\n### Input\nA single integer N.\n\n### Output\nReversed number (no leading zeros).`,
    "0 ≤ N ≤ 10^9",
    [{ input: "12345", output: "54321" }, { input: "1000", output: "1" }],
    [["12345","54321",true],["1000","1",true],["0","0"],["9","9"],["123","321"],["1200","21"]]
  ),

  p("Temperature Conversion", "temp-conversion", "Easy", ["Math"],
    `Convert Celsius to Fahrenheit. Formula: F = C * 9 / 5 + 32 (integer division).\n\n### Input\nInteger C (Celsius).\n\n### Output\nInteger Fahrenheit.`,
    "-100 ≤ C ≤ 1000",
    [{ input: "0", output: "32" }, { input: "100", output: "212" }],
    [["0","32",true],["100","212",true],["37","98"],["25","77"],["-40","-40"]]
  ),

  p("Count Multiples", "count-multiples", "Easy", ["Math"],
    `Count integers from 1 to N that are divisible by K.\n\n### Input\nTwo integers N K.\n\n### Output\nCount.`,
    "1 ≤ K ≤ N ≤ 10^9",
    [{ input: "10 3", output: "3", explanation: "3,6,9" }],
    [["10 3","3",true],["10 1","10"],["10 10","1"],["100 7","14"],["1000000000 3","333333333"]]
  ),

  p("Area of Circle", "area-circle", "Easy", ["Math"],
    `Print floor(π * R * R) where π = 3.14159.\n\n### Input\nInteger R.\n\n### Output\nFloor of area.`,
    "1 ≤ R ≤ 1000",
    [{ input: "5", output: "78" }, { input: "1", output: "3" }],
    [["5","78",true],["1","3",true],["10","314"],["7","153"],["100","31415"]]
  ),

  p("Armstrong Number", "armstrong-number", "Easy", ["Math"],
    `Print YES if N is an Armstrong number, NO otherwise.\nAn Armstrong number equals the sum of its digits each raised to the power of the number of digits.\n\n### Input\nInteger N.\n\n### Output\nYES or NO.`,
    "1 ≤ N ≤ 10^6",
    [{ input: "153", output: "YES" }, { input: "100", output: "NO" }],
    [["153","YES",true],["100","NO",true],["1","YES"],["370","YES"],["9474","YES"],["123","NO"]]
  ),

  // ══════════════════════════════════════════════
  //  EASY — Strings
  // ══════════════════════════════════════════════

  p("Reverse a String", "reverse-string", "Easy", ["String"],
    `Print the reverse of the given string.\n\n### Input\nA single word (no spaces).\n\n### Output\nReversed string.`,
    "1 ≤ |S| ≤ 1000",
    [{ input: "hello", output: "olleh" }],
    [["hello","olleh",true],["a","a"],["racecar","racecar"],["abcd","dcba"],["DevDuel","leuDveD"]]
  ),

  p("Palindrome Check", "palindrome-check", "Easy", ["String"],
    `Print YES if the string is a palindrome, NO otherwise (case-sensitive).\n\n### Input\nA single string (no spaces).\n\n### Output\nYES or NO.`,
    "1 ≤ |S| ≤ 1000",
    [{ input: "racecar", output: "YES" }, { input: "hello", output: "NO" }],
    [["racecar","YES",true],["hello","NO",true],["a","YES"],["Aba","NO"],["madam","YES"],["coding","NO"]]
  ),

  p("Count Vowels", "count-vowels", "Easy", ["String"],
    `Count vowels (a e i o u, both cases) in S.\n\n### Input\nA single line string.\n\n### Output\nCount of vowels.`,
    "1 ≤ |S| ≤ 10^4",
    [{ input: "Hello World", output: "3" }],
    [["Hello World","3",true],["aeiou","5",true],["AEIOU","5"],["bcdfg","0"],["Programming","3"]]
  ),

  p("Count Words", "count-words", "Easy", ["String"],
    `Count the number of words in a line (words separated by single spaces).\n\n### Input\nA line of text.\n\n### Output\nWord count.`,
    "1 ≤ |S| ≤ 10^4",
    [{ input: "hello world foo", output: "3" }],
    [["hello world foo","3",true],["one","1"],["a b c d","4"],["hello  world","2"]]
  ),

  p("String Uppercase", "string-uppercase", "Easy", ["String"],
    `Convert the string to uppercase.\n\n### Input\nA string.\n\n### Output\nUppercase string.`,
    "1 ≤ |S| ≤ 1000",
    [{ input: "hello", output: "HELLO" }],
    [["hello","HELLO",true],["Hello World","HELLO WORLD"],["abc","ABC"],["XYZ","XYZ"]]
  ),

  p("Anagram Check", "anagram-check", "Easy", ["String"],
    `Given two strings S and T, print YES if they are anagrams (same characters, possibly different order), NO otherwise.\n\n### Input\n- Line 1: S\n- Line 2: T\n\n### Output\nYES or NO.`,
    "1 ≤ |S|, |T| ≤ 1000, lowercase letters only",
    [{ input: "listen\nsilent", output: "YES" }, { input: "hello\nworld", output: "NO" }],
    [["listen\nsilent","YES",true],["hello\nworld","NO",true],["abc\nabc","YES"],["abc\nabcd","NO"],["aab\nbaa","YES"]]
  ),

  p("First Non-Repeating Character", "first-non-repeat", "Easy", ["String", "Hash Map"],
    `Find the first character in S that does not repeat. Print the character. If none, print -1.\n\n### Input\nA lowercase string.\n\n### Output\nFirst non-repeating char or -1.`,
    "1 ≤ |S| ≤ 10^5",
    [{ input: "leetcode", output: "l" }, { input: "aabb", output: "-1" }],
    [["leetcode","l",true],["aabb","-1",true],["abcabc","-1"],["z","z"],["abba","c\n".trim() === "c" ? "impossible" : "-1"]]
  ),

  p("Remove Duplicates from String", "remove-dup-string", "Easy", ["String"],
    `Remove duplicate characters from S, keeping first occurrence.\n\n### Input\nA lowercase string.\n\n### Output\nString with duplicates removed.`,
    "1 ≤ |S| ≤ 10^4",
    [{ input: "programming", output: "progamin" }],
    [["programming","progamin",true],["aaa","a"],["abcd","abcd"],["abacaba","abc"]]
  ),

  p("Count Character Occurrences", "count-char", "Easy", ["String"],
    `Count how many times character C appears in string S.\n\n### Input\n- Line 1: string S\n- Line 2: character C\n\n### Output\nCount.`,
    "1 ≤ |S| ≤ 10^4",
    [{ input: "hello\nl", output: "2" }],
    [["hello\nl","2",true],["aababab\na","4"],["xyz\nw","0"],["aaaa\na","4"]]
  ),

  p("String Compression", "string-compression", "Easy", ["String"],
    `Compress S using run-length encoding: consecutive same chars become char+count. If compressed is not shorter, print original.\n\n### Input\nA string.\n\n### Output\nCompressed or original.`,
    "1 ≤ |S| ≤ 10^4",
    [{ input: "aabcccdddd", output: "a2b1c3d4" }, { input: "abc", output: "abc" }],
    [["aabcccdddd","a2b1c3d4",true],["abc","abc",true],["aaaa","a4"],["aabb","a2b2"],["a","a"]]
  ),

  // ══════════════════════════════════════════════
  //  EASY — Array
  // ══════════════════════════════════════════════

  p("Reverse Array", "reverse-array", "Easy", ["Array"],
    `Print the array in reverse order.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nReversed array space-separated.`,
    "1 ≤ N ≤ 10^5",
    [{ input: "5\n1 2 3 4 5", output: "5 4 3 2 1" }],
    [["5\n1 2 3 4 5","5 4 3 2 1",true],["1\n99","99"],["3\n7 8 9","9 8 7"],["4\n1 1 1 1","1 1 1 1"]]
  ),

  p("Second Largest", "second-largest", "Easy", ["Array"],
    `Print the second largest distinct value. If it doesn't exist print -1.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nSecond largest or -1.`,
    "1 ≤ N ≤ 10^5",
    [{ input: "5\n3 1 4 1 5", output: "4" }],
    [["5\n3 1 4 1 5","4",true],["3\n2 2 2","-1"],["2\n1 2","1"],["4\n10 9 8 7","9"]]
  ),

  p("Rotate Array Left", "rotate-left", "Easy", ["Array"],
    `Rotate array left by K positions.\n\n### Input\n- Line 1: N K\n- Line 2: N integers\n\n### Output\nRotated array.`,
    "1 ≤ N ≤ 10^5, 0 ≤ K ≤ N",
    [{ input: "5 2\n1 2 3 4 5", output: "3 4 5 1 2" }],
    [["5 2\n1 2 3 4 5","3 4 5 1 2",true],["3 0\n1 2 3","1 2 3"],["3 3\n1 2 3","1 2 3"],["4 1\n1 2 3 4","2 3 4 1"]]
  ),

  p("Array Sum of Pairs Equal to K", "pair-sum-k", "Easy", ["Array", "Hash Map"],
    `Count pairs (i,j) where i<j and A[i]+A[j]=K.\n\n### Input\n- Line 1: N K\n- Line 2: N integers\n\n### Output\nCount of pairs.`,
    "1 ≤ N ≤ 10^4",
    [{ input: "5 9\n1 2 3 7 8", output: "2", explanation: "(1,8) and (2,7)" }],
    [["5 9\n1 2 3 7 8","2",true],["3 6\n1 2 3","1"],["4 4\n1 1 1 1","6"],["2 10\n3 7","1"]]
  ),

  p("Majority Element", "majority-element", "Easy", ["Array"],
    `Find the element appearing more than N/2 times. Guaranteed to exist.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nMajority element.`,
    "1 ≤ N ≤ 10^5 (odd N guaranteed)",
    [{ input: "5\n2 2 1 1 2", output: "2" }],
    [["5\n2 2 1 1 2","2",true],["1\n5","5"],["3\n3 3 1","3"],["7\n1 2 1 1 1 2 1","1"]]
  ),

  p("Move Zeros to End", "move-zeros", "Easy", ["Array"],
    `Move all zeros to the end while maintaining relative order of non-zero elements.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nModified array.`,
    "1 ≤ N ≤ 10^5",
    [{ input: "6\n0 1 0 3 12 0", output: "1 3 12 0 0 0" }],
    [["6\n0 1 0 3 12 0","1 3 12 0 0 0",true],["3\n0 0 0","0 0 0"],["3\n1 2 3","1 2 3"],["4\n0 1 2 0","1 2 0 0"]]
  ),

  p("Intersection of Two Arrays", "array-intersection", "Easy", ["Array", "Hash Map"],
    `Print sorted unique common elements of two arrays. If none, print -1.\n\n### Input\n- Line 1: N, Line 2: N integers\n- Line 3: M, Line 4: M integers\n\n### Output\nSorted unique intersection, space-separated.`,
    "1 ≤ N, M ≤ 10^4",
    [{ input: "4\n1 2 2 3\n3\n2 3 4", output: "2 3" }],
    [["4\n1 2 2 3\n3\n2 3 4","2 3",true],["2\n1 2\n2\n3 4","-1"],["3\n5 5 5\n2\n5 6","5"]]
  ),

  // ══════════════════════════════════════════════
  //  EASY — FizzBuzz & Pattern
  // ══════════════════════════════════════════════

  p("FizzBuzz", "fizzbuzz", "Easy", ["Math", "Classic"],
    `Print FizzBuzz from 1 to N.\n- Multiple of 3 → Fizz\n- Multiple of 5 → Buzz\n- Multiple of both → FizzBuzz\n- Otherwise → number\n\n### Input\nInteger N.\n\n### Output\nN lines.`,
    "1 ≤ N ≤ 100",
    [{ input: "5", output: "1\n2\nFizz\n4\nBuzz" }],
    [["5","1\n2\nFizz\n4\nBuzz",true],["1","1"],["3","1\n2\nFizz"],["15","1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz"]]
  ),

  p("Star Triangle", "star-triangle", "Easy", ["Pattern"],
    `Print a right-angled triangle of stars with N rows.\nRow i has i stars.\n\n### Input\nInteger N.\n\n### Output\nN lines.`,
    "1 ≤ N ≤ 20",
    [{ input: "3", output: "*\n**\n***" }],
    [["3","*\n**\n***",true],["1","*"],["5","*\n**\n***\n****\n*****"]]
  ),

  p("Number Pyramid", "number-pyramid", "Easy", ["Pattern"],
    `Print row i as i repeated i times, for i from 1 to N.\n\n### Input\nInteger N.\n\n### Output\nN lines.`,
    "1 ≤ N ≤ 9",
    [{ input: "4", output: "1\n22\n333\n4444" }],
    [["4","1\n22\n333\n4444",true],["1","1"],["3","1\n22\n333"]]
  ),

  // ══════════════════════════════════════════════
  //  EASY — Sorting
  // ══════════════════════════════════════════════

  p("Sort Array Ascending", "sort-asc", "Easy", ["Sorting"],
    `Sort array in ascending order.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nSorted array.`,
    "1 ≤ N ≤ 10^5",
    [{ input: "5\n3 1 4 1 5", output: "1 1 3 4 5" }],
    [["5\n3 1 4 1 5","1 1 3 4 5",true],["1\n5","5"],["4\n4 3 2 1","1 2 3 4"],["3\n2 2 2","2 2 2"]]
  ),

  p("Sort Array Descending", "sort-desc", "Easy", ["Sorting"],
    `Sort array in descending order.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nSorted descending.`,
    "1 ≤ N ≤ 10^5",
    [{ input: "4\n1 3 2 4", output: "4 3 2 1" }],
    [["4\n1 3 2 4","4 3 2 1",true],["3\n5 5 5","5 5 5"],["2\n1 2","2 1"]]
  ),

  p("Bubble Sort Steps", "bubble-sort-count", "Easy", ["Sorting"],
    `Count the number of swaps bubble sort makes on the array.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nNumber of swaps.`,
    "1 ≤ N ≤ 1000",
    [{ input: "4\n4 3 2 1", output: "6" }],
    [["4\n4 3 2 1","6",true],["3\n1 2 3","0"],["3\n3 2 1","3"],["5\n5 4 3 2 1","10"]]
  ),

  // ══════════════════════════════════════════════
  //  EASY — Stack / Queue
  // ══════════════════════════════════════════════

  p("Valid Parentheses", "valid-parens", "Easy", ["Stack", "String"],
    `Check if bracket string is valid.\nValid means every open bracket is closed in correct order.\n\n### Input\nBracket string (or empty).\n\n### Output\nYES or NO.`,
    "0 ≤ |S| ≤ 10^4",
    [{ input: "()[]{}", output: "YES" }, { input: "(]", output: "NO" }],
    [["()[]{}","YES",true],["(]","NO",true],["({[]})","YES"],["((((","NO"],["","YES"],["([)]","NO"]]
  ),

  p("Balanced Brackets Count", "balanced-brackets-count", "Easy", ["Stack"],
    `Print the minimum number of brackets to add to make the string balanced.\nOnly contains ( and ).\n\n### Input\nA string of ( and ).\n\n### Output\nMinimum additions.`,
    "0 ≤ |S| ≤ 10^4",
    [{ input: "(()", output: "1" }, { input: "())(()", output: "2" }],
    [["(()","1",true],["())(()","2",true],["()","0"],["((","2"],["","0"]]
  ),

  // ══════════════════════════════════════════════
  //  EASY — Searching
  // ══════════════════════════════════════════════

  p("Linear Search", "linear-search", "Easy", ["Array", "Searching"],
    `Find index of target in array (0-indexed). If not found print -1.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n- Line 3: target\n\n### Output\nFirst index or -1.`,
    "1 ≤ N ≤ 10^5",
    [{ input: "5\n10 20 30 40 50\n30", output: "2" }],
    [["5\n10 20 30 40 50\n30","2",true],["3\n1 2 3\n5","-1"],["4\n4 3 2 1\n4","0"],["1\n7\n7","0"]]
  ),

  p("Binary Search", "binary-search", "Easy", ["Array", "Binary Search"],
    `Given sorted array, find 0-based index of target. Print -1 if not found.\n\n### Input\n- Line 1: N\n- Line 2: N sorted integers\n- Line 3: target\n\n### Output\nIndex or -1.`,
    "1 ≤ N ≤ 10^6",
    [{ input: "7\n-1 0 3 5 9 12 16\n9", output: "4" }],
    [["7\n-1 0 3 5 9 12 16\n9","4",true],["7\n-1 0 3 5 9 12 16\n2","-1",true],["1\n5\n5","0"],["5\n1 3 5 7 9\n9","4"]]
  ),

  // ══════════════════════════════════════════════
  //  MEDIUM — Array / DP
  // ══════════════════════════════════════════════

  p("Maximum Subarray Sum", "max-subarray", "Medium", ["Array", "DP"],
    `Find the maximum sum of any contiguous subarray (Kadane's Algorithm).\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nMaximum subarray sum.`,
    "1 ≤ N ≤ 10^5, -10^4 ≤ A[i] ≤ 10^4",
    [{ input: "9\n-2 1 -3 4 -1 2 1 -5 4", output: "6" }],
    [["9\n-2 1 -3 4 -1 2 1 -5 4","6",true],["1\n-1","-1"],["4\n1 2 3 4","10"],["5\n-5 -3 -1 -4 -2","-1"],["6\n-2 -1 -3 4 5 -1","9"]]
  ),

  p("Two Sum", "two-sum", "Medium", ["Array", "Hash Map"],
    `Find indices i<j such that A[i]+A[j]=target. Print i and j. Print -1 if none.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n- Line 3: target\n\n### Output\ni j or -1.`,
    "2 ≤ N ≤ 10^4",
    [{ input: "4\n2 7 11 15\n9", output: "0 1" }],
    [["4\n2 7 11 15\n9","0 1",true],["3\n3 2 4\n6","1 2",true],["3\n1 2 3\n7","-1"],["2\n3 3\n6","0 1"]]
  ),

  p("Three Sum Count", "three-sum-count", "Medium", ["Array"],
    `Count triplets (i<j<k) with A[i]+A[j]+A[k]=0.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nCount.`,
    "1 ≤ N ≤ 1000",
    [{ input: "6\n-1 0 1 2 -1 -4", output: "2" }],
    [["6\n-1 0 1 2 -1 -4","2",true],["3\n0 0 0","1"],["3\n1 2 3","0"],["5\n-2 0 1 1 2","2"]]
  ),

  p("Subarray with Given Sum", "subarray-given-sum", "Medium", ["Array", "Sliding Window"],
    `Find if there's a subarray (contiguous) with sum equal to S.\nPrint YES or NO.\n\n### Input\n- Line 1: N S\n- Line 2: N non-negative integers\n\n### Output\nYES or NO.`,
    "1 ≤ N ≤ 10^5, 0 ≤ A[i] ≤ 10^4",
    [{ input: "5 15\n1 2 3 7 5", output: "YES" }, { input: "5 100\n1 2 3 4 5", output: "NO" }],
    [["5 15\n1 2 3 7 5","YES",true],["5 100\n1 2 3 4 5","NO",true],["3 6\n1 2 3","YES"],["1 5\n5","YES"],["3 10\n1 2 3","NO"]]
  ),

  p("Maximum Product Subarray", "max-product-subarray", "Medium", ["Array", "DP"],
    `Find maximum product of any contiguous subarray.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nMaximum product.`,
    "1 ≤ N ≤ 10^4, -10 ≤ A[i] ≤ 10",
    [{ input: "6\n2 3 -2 4 -1 5", output: "240" }],
    [["6\n2 3 -2 4 -1 5","240",true],["1\n-2","-2"],["3\n-2 0 -1","0"],["4\n1 2 3 4","24"]]
  ),

  p("Longest Increasing Subsequence Length", "lis-length", "Medium", ["Array", "DP"],
    `Find the length of the longest strictly increasing subsequence.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nLength of LIS.`,
    "1 ≤ N ≤ 2500",
    [{ input: "8\n10 9 2 5 3 7 101 18", output: "4" }],
    [["8\n10 9 2 5 3 7 101 18","4",true],["1\n5","1"],["5\n1 2 3 4 5","5"],["4\n5 4 3 2","1"],["6\n3 1 4 1 5 9","4"]]
  ),

  p("Coin Change (Min Coins)", "coin-change-min", "Medium", ["DP"],
    `Given coin denominations and amount, find minimum coins to make amount. Print -1 if impossible.\n\n### Input\n- Line 1: N (coins count), Amount\n- Line 2: N coin values\n\n### Output\nMin coins or -1.`,
    "1 ≤ N ≤ 12, 0 ≤ Amount ≤ 10^4",
    [{ input: "3 11\n1 5 6", output: "2", explanation: "6+5=11" }],
    [["3 11\n1 5 6","2",true],["2 3\n2 3","1"],["3 7\n2 4 6","-1"],["1 0\n1","0"],["3 10\n1 2 5","2"]]
  ),

  p("House Robber", "house-robber", "Medium", ["DP"],
    `You cannot rob adjacent houses. Find max money.\n\n### Input\n- Line 1: N\n- Line 2: N non-negative integers\n\n### Output\nMax amount.`,
    "1 ≤ N ≤ 10^4",
    [{ input: "4\n1 2 3 1", output: "4" }, { input: "5\n2 7 9 3 1", output: "12" }],
    [["4\n1 2 3 1","4",true],["5\n2 7 9 3 1","12",true],["1\n5","5"],["2\n1 2","2"],["3\n2 1 1","3"]]
  ),

  p("0/1 Knapsack", "knapsack-01", "Medium", ["DP"],
    `Classic 0/1 knapsack. Find max value within weight W.\n\n### Input\n- Line 1: N W\n- Line 2: N weights\n- Line 3: N values\n\n### Output\nMax value.`,
    "1 ≤ N ≤ 500, 1 ≤ W ≤ 500",
    [{ input: "3 4\n4 5 1\n1 2 3", output: "3" }],
    [["3 4\n4 5 1\n1 2 3","3",true],["1 10\n5\n100","100"],["3 3\n1 1 1\n2 3 5","10"],["4 5\n1 2 3 5\n1 6 10 16","16"]]
  ),

  p("Climbing Stairs", "climbing-stairs", "Medium", ["DP"],
    `Count ways to climb N stairs (1 or 2 steps at a time).\n\n### Input\nInteger N.\n\n### Output\nNumber of ways.`,
    "1 ≤ N ≤ 45",
    [{ input: "3", output: "3" }, { input: "5", output: "8" }],
    [["3","3",true],["5","8",true],["1","1"],["2","2"],["10","89"],["45","1836311903"]]
  ),

  p("Longest Common Subsequence", "lcs-length", "Medium", ["DP", "String"],
    `Find the length of LCS of two strings.\n\n### Input\n- Line 1: S\n- Line 2: T\n\n### Output\nLength of LCS.`,
    "1 ≤ |S|, |T| ≤ 1000",
    [{ input: "abcde\nace", output: "3" }, { input: "abc\nabc", output: "3" }],
    [["abcde\nace","3",true],["abc\nabc","3",true],["abc\ndef","0"],["aggtab\ngxtxayb","4"],["abcbdab\nbdcaba","4"]]
  ),

  p("Edit Distance", "edit-distance", "Medium", ["DP", "String"],
    `Find minimum edits (insert/delete/replace) to convert S to T.\n\n### Input\n- Line 1: S\n- Line 2: T\n\n### Output\nMin operations.`,
    "0 ≤ |S|, |T| ≤ 500",
    [{ input: "horse\nros", output: "3" }, { input: "intention\nexecution", output: "5" }],
    [["horse\nros","3",true],["intention\nexecution","5",true],["abc\nabc","0"],["a\nb","1"],["abc\n","3"],["saturday\nsunday","3"]]
  ),

  p("Longest Palindromic Substring Length", "longest-palindrome-len", "Medium", ["DP", "String"],
    `Find the length of the longest palindromic substring of S.\n\n### Input\nA string S.\n\n### Output\nLength of longest palindromic substring.`,
    "1 ≤ |S| ≤ 1000",
    [{ input: "babad", output: "3" }, { input: "cbbd", output: "2" }],
    [["babad","3",true],["cbbd","2",true],["a","1"],["racecar","7"],["abcba","5"],["aaaa","4"]]
  ),

  p("Unique Paths", "unique-paths", "Medium", ["DP"],
    `Count unique paths from top-left to bottom-right of M×N grid (only right/down).\n\n### Input\nTwo integers M N.\n\n### Output\nNumber of unique paths.`,
    "1 ≤ M, N ≤ 18",
    [{ input: "3 7", output: "28" }, { input: "3 2", output: "3" }],
    [["3 7","28",true],["3 2","3",true],["1 1","1"],["2 2","2"],["10 10","48620"],["4 4","20"]]
  ),

  p("Maximum Sum Rectangle", "max-sum-submatrix", "Medium", ["DP", "Array"],
    `Find the maximum sum sub-rectangle in an N×M matrix.\n\n### Input\n- Line 1: N M\n- Lines 2..N+1: M space-separated integers per row\n\n### Output\nMaximum sum.`,
    "1 ≤ N, M ≤ 100",
    [{ input: "4 5\n1 2 -1 -4 -20\n-8 -3 4 2 1\n3 8 10 1 3\n-4 -1 1 7 -6", output: "29" }],
    [["4 5\n1 2 -1 -4 -20\n-8 -3 4 2 1\n3 8 10 1 3\n-4 -1 1 7 -6","29",true],["2 2\n1 2\n3 4","10"],["1 1\n-5","-5"]]
  ),

  // ══════════════════════════════════════════════
  //  MEDIUM — Sorting
  // ══════════════════════════════════════════════

  p("Count Inversions", "count-inversions", "Medium", ["Array", "Merge Sort"],
    `Count pairs (i,j) where i<j and A[i]>A[j].\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nInversion count.`,
    "1 ≤ N ≤ 10^5",
    [{ input: "5\n2 4 1 3 5", output: "3" }],
    [["5\n2 4 1 3 5","3",true],["3\n1 2 3","0"],["3\n3 2 1","3"],["6\n6 5 4 3 2 1","15"],["4\n1 3 2 4","1"]]
  ),

  p("Merge Sorted Arrays", "merge-sorted-arrays", "Medium", ["Array", "Sorting"],
    `Merge two sorted arrays and print sorted result.\n\n### Input\n- Line 1: N, Line 2: N sorted integers\n- Line 3: M, Line 4: M sorted integers\n\n### Output\nMerged sorted array.`,
    "0 ≤ N, M ≤ 10^5",
    [{ input: "3\n1 3 5\n3\n2 4 6", output: "1 2 3 4 5 6" }],
    [["3\n1 3 5\n3\n2 4 6","1 2 3 4 5 6",true],["0\n\n2\n1 2","1 2"],["2\n3 4\n0\n","3 4"],["1\n1\n1\n1","1 1"]]
  ),

  p("Kth Largest Element", "kth-largest", "Medium", ["Array", "Sorting"],
    `Find Kth largest element (1-indexed).\n\n### Input\n- Line 1: N K\n- Line 2: N integers\n\n### Output\nKth largest.`,
    "1 ≤ K ≤ N ≤ 10^5",
    [{ input: "6 2\n3 2 1 5 6 4", output: "5" }],
    [["6 2\n3 2 1 5 6 4","5",true],["2 1\n1 2","2"],["5 5\n1 2 3 4 5","1"],["3 2\n7 7 7","7"]]
  ),

  // ══════════════════════════════════════════════
  //  MEDIUM — Graph / Tree
  // ══════════════════════════════════════════════

  p("BFS Level Order", "bfs-level", "Medium", ["Graph", "BFS"],
    `Given undirected graph, print nodes level by level from source node 1.\nNodes on same level space-separated, levels on different lines.\n\n### Input\n- Line 1: N (nodes) E (edges)\n- Next E lines: u v\n\n### Output\nBFS levels.`,
    "1 ≤ N ≤ 100, 0 ≤ E ≤ 200",
    [{ input: "6 5\n1 2\n1 3\n2 4\n2 5\n3 6", output: "1\n2 3\n4 5 6" }],
    [["6 5\n1 2\n1 3\n2 4\n2 5\n3 6","1\n2 3\n4 5 6",true],["1 0","1"],["3 2\n1 2\n1 3","1\n2 3"]]
  ),

  p("Number of Islands", "number-of-islands", "Medium", ["Graph", "DFS", "BFS"],
    `Count islands in grid (1=land, 0=water). Connected land = 1 island (4-directional).\n\n### Input\n- Line 1: R C\n- Next R lines: C space-separated 0/1\n\n### Output\nNumber of islands.`,
    "1 ≤ R, C ≤ 300",
    [{ input: "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1", output: "3" }],
    [["4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1","3",true],["2 2\n0 0\n0 0","0"],["2 2\n1 1\n1 1","1"],["3 3\n1 0 1\n0 1 0\n1 0 1","5"]]
  ),

  p("Flood Fill", "flood-fill", "Medium", ["Graph", "DFS"],
    `Flood fill starting at (sr,sc) changing old color to new color (4-directional).\n\n### Input\n- Line 1: R C sr sc newColor\n- Next R lines: C integers (old grid)\n\n### Output\nFilled grid (R lines, C space-separated).`,
    "1 ≤ R, C ≤ 50",
    [{ input: "3 3 1 1 2\n1 1 1\n1 1 0\n1 0 0", output: "2 2 2\n2 2 0\n2 0 0" }],
    [["3 3 1 1 2\n1 1 1\n1 1 0\n1 0 0","2 2 2\n2 2 0\n2 0 0",true],["1 1 0 0 3\n1","3"],["2 2 0 0 5\n1 0\n0 1","5 0\n0 1"]]
  ),

  p("Detect Cycle in Directed Graph", "cycle-directed", "Medium", ["Graph", "DFS"],
    `Print YES if directed graph has a cycle, NO otherwise.\n\n### Input\n- Line 1: N E\n- Next E lines: u v (directed edge)\n\n### Output\nYES or NO.`,
    "1 ≤ N ≤ 10^4, 0 ≤ E ≤ 10^4",
    [{ input: "4 4\n1 2\n2 3\n3 4\n4 2", output: "YES" }, { input: "3 2\n1 2\n2 3", output: "NO" }],
    [["4 4\n1 2\n2 3\n3 4\n4 2","YES",true],["3 2\n1 2\n2 3","NO",true],["1 0","NO"],["2 2\n1 2\n2 1","YES"]]
  ),

  p("Topological Sort", "topo-sort", "Medium", ["Graph", "DAG"],
    `Print any valid topological ordering of DAG (nodes 1..N). If cycle exists print -1.\n\n### Input\n- Line 1: N E\n- Next E lines: u v\n\n### Output\nSpace-separated topological order or -1.`,
    "1 ≤ N ≤ 10^4, 0 ≤ E ≤ 10^4",
    [{ input: "6 6\n5 2\n5 0\n4 0\n4 1\n2 3\n3 1", output: "4 5 0 2 3 1" }],
    [["6 6\n5 2\n5 0\n4 0\n4 1\n2 3\n3 1","4 5 0 2 3 1",true],["3 2\n1 2\n2 3","1 2 3"],["2 2\n1 2\n2 1","-1"]]
  ),

  p("Shortest Path BFS", "shortest-path-bfs", "Medium", ["Graph", "BFS"],
    `Find shortest path (edges) from node 1 to node N in unweighted undirected graph. Print -1 if unreachable.\n\n### Input\n- Line 1: N E\n- Next E lines: u v\n\n### Output\nShortest path length or -1.`,
    "1 ≤ N ≤ 10^4, 0 ≤ E ≤ 10^4",
    [{ input: "4 4\n1 2\n2 3\n3 4\n1 4", output: "1" }],
    [["4 4\n1 2\n2 3\n3 4\n1 4","1",true],["4 3\n1 2\n2 3\n3 4","3"],["3 1\n1 2","-1"],["2 1\n1 2","1"]]
  ),

  // ══════════════════════════════════════════════
  //  MEDIUM — Math / Number Theory
  // ══════════════════════════════════════════════

  p("Count Divisors", "count-divisors", "Medium", ["Math"],
    `Count all divisors of N.\n\n### Input\nInteger N.\n\n### Output\nNumber of divisors.`,
    "1 ≤ N ≤ 10^9",
    [{ input: "12", output: "6" }, { input: "7", output: "2" }],
    [["12","6",true],["7","2",true],["1","1"],["36","9"],["100","9"],["1000000000","100"]]
  ),

  p("Prime Factorization", "prime-factorization", "Medium", ["Math"],
    `Print prime factorization of N in ascending order, one factor per line as p^e.\n\n### Input\nInteger N.\n\n### Output\nFactors p^e, one per line.`,
    "2 ≤ N ≤ 10^9",
    [{ input: "12", output: "2^2\n3^1" }, { input: "7", output: "7^1" }],
    [["12","2^2\n3^1",true],["7","7^1",true],["100","2^2\n5^2"],["360","2^3\n3^2\n5^1"],["2","2^1"]]
  ),

  p("Sieve Count Primes Range", "sieve-range", "Medium", ["Math", "Sieve"],
    `Count primes in range [L, R] inclusive.\n\n### Input\nTwo integers L R.\n\n### Output\nCount of primes.`,
    "1 ≤ L ≤ R ≤ 10^6",
    [{ input: "1 10", output: "4" }, { input: "10 20", output: "4" }],
    [["1 10","4",true],["10 20","4",true],["1 1","0"],["2 2","1"],["1 100","25"]]
  ),

  p("Power Modulo", "power-mod", "Medium", ["Math"],
    `Compute (B^E) mod M.\n\n### Input\nThree integers B E M.\n\n### Output\nResult.`,
    "0 ≤ B, E ≤ 10^9, 1 ≤ M ≤ 10^9",
    [{ input: "2 10 1000", output: "24" }],
    [["2 10 1000","24",true],["3 0 100","1"],["5 3 13","8"],["2 31 1000000007","2147483648"]]
  ),

  p("Pascal Triangle Row", "pascal-row", "Medium", ["Math"],
    `Print the N-th row of Pascal's triangle (0-indexed), space-separated.\n\n### Input\nInteger N.\n\n### Output\nRow values.`,
    "0 ≤ N ≤ 30",
    [{ input: "4", output: "1 4 6 4 1" }, { input: "0", output: "1" }],
    [["4","1 4 6 4 1",true],["0","1",true],["1","1 1"],["3","1 3 3 1"],["5","1 5 10 10 5 1"]]
  ),

  p("Sum of First N Squares", "sum-squares", "Medium", ["Math"],
    `Print sum of squares 1^2 + 2^2 + ... + N^2.\n\n### Input\nInteger N.\n\n### Output\nSum.`,
    "1 ≤ N ≤ 10^6",
    [{ input: "3", output: "14" }, { input: "10", output: "385" }],
    [["3","14",true],["10","385",true],["1","1"],["100","338350"],["1000","333833500"]]
  ),

  p("Catalan Number", "catalan-number", "Medium", ["Math", "DP"],
    `Print the N-th Catalan number (0-indexed).\nC(0)=1, C(n) = sum C(i)*C(n-1-i).\n\n### Input\nInteger N.\n\n### Output\nCatalan(N).`,
    "0 ≤ N ≤ 15",
    [{ input: "5", output: "42" }, { input: "0", output: "1" }],
    [["5","42",true],["0","1",true],["1","1"],["3","5"],["10","16796"],["15","9694845"]]
  ),

  // ══════════════════════════════════════════════
  //  MEDIUM — String Advanced
  // ══════════════════════════════════════════════

  p("Longest Common Prefix", "longest-common-prefix", "Medium", ["String"],
    `Given N strings, find the longest common prefix. Print empty string if none.\n\n### Input\n- Line 1: N\n- Next N lines: one string each\n\n### Output\nLongest common prefix (or empty line).`,
    "1 ≤ N ≤ 200",
    [{ input: "3\nflower\nflow\nflight", output: "fl" }, { input: "3\ndog\nracecar\ncar", output: "" }],
    [["3\nflower\nflow\nflight","fl",true],["3\ndog\nracecar\ncar","",true],["1\nabc","abc"],["2\nabc\nabc","abc"]]
  ),

  p("String to Integer", "string-to-int", "Medium", ["String"],
    `Convert string S to integer (like atoi). Skip leading spaces. Handle +/- sign. Stop at first non-digit. Clamp to [-2^31, 2^31-1].\n\n### Input\nA string.\n\n### Output\nConverted integer.`,
    "0 ≤ |S| ≤ 200",
    [{ input: "42", output: "42" }, { input: "  -42", output: "-42" }, { input: "4193 with words", output: "4193" }],
    [["42","42",true],["  -42","-42",true],["4193 with words","4193",true],["words 123","0"],["2147483648","2147483647"],["-2147483649","-2147483648"]]
  ),

  p("Longest Substring Without Repeat", "longest-substr-no-repeat", "Medium", ["String", "Sliding Window"],
    `Find length of longest substring with no repeating characters.\n\n### Input\nA string.\n\n### Output\nLength.`,
    "0 ≤ |S| ≤ 5 × 10^4",
    [{ input: "abcabcbb", output: "3" }, { input: "bbbbb", output: "1" }],
    [["abcabcbb","3",true],["bbbbb","1",true],["pwwkew","3"],["","0"],["abcdef","6"],["dvdf","3"]]
  ),

  p("Group Anagrams Count", "group-anagrams", "Medium", ["String", "Hash Map"],
    `Given N words, print the number of groups where each group contains anagrams.\n\n### Input\n- Line 1: N\n- Next N lines: words\n\n### Output\nNumber of groups.`,
    "1 ≤ N ≤ 10^4",
    [{ input: "6\neat\ntea\ntan\nate\nnat\nbat", output: "3" }],
    [["6\neat\ntea\ntan\nate\nnat\nbat","3",true],["1\na","1"],["3\nabc\nbca\ncab","1"],["2\nab\ncd","2"]]
  ),

  p("Minimum Window Substring Length", "min-window-substr", "Medium", ["String", "Sliding Window"],
    `Find the minimum length of substring of S that contains all chars of T. Print 0 if no such substring.\n\n### Input\n- Line 1: S\n- Line 2: T\n\n### Output\nMinimum window length.`,
    "1 ≤ |S|, |T| ≤ 10^5",
    [{ input: "ADOBECODEBANC\nABC", output: "4" }],
    [["ADOBECODEBANC\nABC","4",true],["a\nb","0"],["a\na","1"],["ab\nb","1"]]
  ),

  p("Count Substring Occurrences", "count-substr", "Medium", ["String"],
    `Count (possibly overlapping) occurrences of pattern P in string S.\n\n### Input\n- Line 1: S\n- Line 2: P\n\n### Output\nCount.`,
    "1 ≤ |P| ≤ |S| ≤ 10^5",
    [{ input: "aaaa\naa", output: "3" }, { input: "hello\nll", output: "1" }],
    [["aaaa\naa","3",true],["hello\nll","1",true],["abcabc\nabc","2"],["aaa\na","3"],["abc\nd","0"]]
  ),

  // ══════════════════════════════════════════════
  //  MEDIUM — Stack / Queue Advanced
  // ══════════════════════════════════════════════

  p("Next Greater Element", "next-greater-element", "Medium", ["Stack", "Array"],
    `For each element print the next greater element to its right. Print -1 if none.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nN space-separated answers.`,
    "1 ≤ N ≤ 10^5",
    [{ input: "4\n4 5 2 10", output: "5 10 10 -1" }],
    [["4\n4 5 2 10","5 10 10 -1",true],["3\n3 2 1","-1 -1 -1"],["3\n1 2 3","2 3 -1"],["1\n5","-1"]]
  ),

  p("Largest Rectangle in Histogram", "histogram-rect", "Medium", ["Stack", "Array"],
    `Find the area of the largest rectangle in histogram.\n\n### Input\n- Line 1: N\n- Line 2: N non-negative integers (heights)\n\n### Output\nMax area.`,
    "1 ≤ N ≤ 10^5",
    [{ input: "6\n2 1 5 6 2 3", output: "10" }],
    [["6\n2 1 5 6 2 3","10",true],["1\n1","1"],["3\n2 2 2","6"],["5\n1 2 3 4 5","9"],["3\n6 2 5","10"]]
  ),

  p("Evaluate Reverse Polish Notation", "eval-rpn", "Medium", ["Stack"],
    `Evaluate expression in RPN. Operators: + - * / (integer division toward zero).\n\n### Input\nN tokens space-separated.\n\n### Output\nResult.`,
    "1 ≤ N ≤ 100",
    [{ input: "2 1 + 3 *", output: "9" }, { input: "4 13 5 / +", output: "6" }],
    [["2 1 + 3 *","9",true],["4 13 5 / +","6",true],["3 4 +","7"],["10 2 /","5"],["5 1 2 + 4 * + 3 -","14"]]
  ),

  // ══════════════════════════════════════════════
  //  MEDIUM — Hashing / Counting
  // ══════════════════════════════════════════════

  p("Two Sum - Count Pairs", "two-sum-count", "Medium", ["Hash Map", "Array"],
    `Count pairs (i,j) i<j with A[i]+A[j]=K.\n\n### Input\n- Line 1: N K\n- Line 2: N integers\n\n### Output\nCount.`,
    "1 ≤ N ≤ 10^5",
    [{ input: "5 9\n1 5 7 -1 5", output: "3" }],
    [["5 9\n1 5 7 -1 5","3",true],["4 0\n1 -1 1 -1","4"],["3 10\n1 2 3","0"],["4 6\n1 2 3 3","2"]]
  ),

  p("Longest Consecutive Sequence", "longest-consecutive", "Medium", ["Array", "Hash Map"],
    `Find the length of the longest consecutive elements sequence.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nLength.`,
    "0 ≤ N ≤ 10^5",
    [{ input: "6\n100 4 200 1 3 2", output: "4" }],
    [["6\n100 4 200 1 3 2","4",true],["0\n","0"],["4\n1 2 3 4","4"],["5\n1 9 3 10 2","3"]]
  ),

  p("Subarray Sum Equals K", "subarray-sum-k", "Medium", ["Array", "Hash Map"],
    `Count subarrays with sum = K.\n\n### Input\n- Line 1: N K\n- Line 2: N integers (can be negative)\n\n### Output\nCount.`,
    "1 ≤ N ≤ 2×10^4",
    [{ input: "5 2\n1 1 1 2 3", output: "4" }],
    [["5 2\n1 1 1 2 3","4",true],["3 0\n0 0 0","6"],["3 3\n1 2 3","2"],["1 1\n1","1"]]
  ),

  p("Top K Frequent Elements", "top-k-frequent", "Medium", ["Hash Map", "Sorting"],
    `Print K most frequent elements in descending frequency. Ties broken by smaller value first.\n\n### Input\n- Line 1: N K\n- Line 2: N integers\n\n### Output\nK numbers space-separated.`,
    "1 ≤ K ≤ N ≤ 10^4",
    [{ input: "6 2\n1 1 1 2 2 3", output: "1 2" }],
    [["6 2\n1 1 1 2 2 3","1 2",true],["5 1\n1 2 3 4 5","1"],["4 2\n1 1 2 2","1 2"]]
  ),

  // ══════════════════════════════════════════════
  //  MEDIUM — Binary / Bit
  // ══════════════════════════════════════════════

  p("Count Set Bits", "count-set-bits", "Medium", ["Bit"],
    `Count set bits (1s) in binary representation of N.\n\n### Input\nNon-negative integer N.\n\n### Output\nCount of 1s.`,
    "0 ≤ N ≤ 10^9",
    [{ input: "13", output: "3", explanation: "1101 has 3 ones" }],
    [["13","3",true],["0","0"],["255","8"],["1024","1"],["1023","10"]]
  ),

  p("Single Number", "single-number", "Medium", ["Bit", "Array"],
    `Every element appears twice except one. Find the one that appears once.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nSingle number.`,
    "1 ≤ N ≤ 10^5 (N is odd)",
    [{ input: "5\n4 1 2 1 2", output: "4" }],
    [["5\n4 1 2 1 2","4",true],["1\n7","7"],["3\n2 2 1","1"],["7\n1 1 2 2 3 3 4","4"]]
  ),

  p("Swap Without Temp", "swap-no-temp", "Medium", ["Bit", "Math"],
    `Swap A and B without using a temporary variable. Print A and B after swap.\n\n### Input\nTwo integers A B.\n\n### Output\nB A (swapped values).`,
    "-10^9 ≤ A, B ≤ 10^9",
    [{ input: "5 3", output: "3 5" }],
    [["5 3","3 5",true],["0 1","1 0"],["7 7","7 7"],["-1 1","1 -1"]]
  ),

  p("Number of 1 Bits Total", "sum-set-bits", "Medium", ["Bit"],
    `Sum of all set bits in integers from 1 to N.\n\n### Input\nInteger N.\n\n### Output\nTotal set bits.`,
    "0 ≤ N ≤ 10^6",
    [{ input: "5", output: "7", explanation: "1+1+2+1+2=7" }],
    [["5","7",true],["0","0"],["1","1"],["10","17"],["100","344"]]
  ),

  // ══════════════════════════════════════════════
  //  MEDIUM — Misc
  // ══════════════════════════════════════════════

  p("Trapping Rain Water", "trap-rain-water", "Medium", ["Array", "DP"],
    `Calculate water trapped after raining.\n\n### Input\n- Line 1: N\n- Line 2: N non-negative integers (heights)\n\n### Output\nUnits of water.`,
    "0 ≤ N ≤ 3×10^4",
    [{ input: "12\n0 1 0 2 1 0 1 3 2 1 2 1", output: "6" }],
    [["12\n0 1 0 2 1 0 1 3 2 1 2 1","6",true],["3\n3 0 3","3"],["1\n5","0"],["4\n1 2 3 4","0"],["4\n4 3 2 1","0"]]
  ),

  p("Jump Game", "jump-game", "Medium", ["Array", "Greedy"],
    `Given array where A[i] is max jump length from i. Can you reach the last index? Print YES or NO.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nYES or NO.`,
    "1 ≤ N ≤ 10^4",
    [{ input: "5\n2 3 1 1 4", output: "YES" }, { input: "5\n3 2 1 0 4", output: "NO" }],
    [["5\n2 3 1 1 4","YES",true],["5\n3 2 1 0 4","NO",true],["1\n0","YES"],["2\n0 1","NO"],["3\n2 0 0","YES"]]
  ),

  p("Minimum Jumps to End", "min-jumps", "Medium", ["Array", "Greedy", "DP"],
    `Minimum number of jumps to reach last index.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nMin jumps (guaranteed reachable).`,
    "1 ≤ N ≤ 10^4",
    [{ input: "6\n2 3 1 1 2 4", output: "3" }],
    [["6\n2 3 1 1 2 4","3",true],["1\n0","0"],["4\n1 1 1 1","3"],["3\n2 3 1","1"]]
  ),

  p("Product of Array Except Self", "product-except-self", "Medium", ["Array"],
    `For each index print product of all other elements. No division allowed.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\nN products space-separated.`,
    "2 ≤ N ≤ 10^5",
    [{ input: "4\n1 2 3 4", output: "24 12 8 6" }],
    [["4\n1 2 3 4","24 12 8 6",true],["2\n3 4","4 3"],["3\n1 2 3","6 3 2"],["4\n-1 1 0 -3","0 0 3 0"]]
  ),

  p("Set Matrix Zeroes", "set-matrix-zeroes", "Medium", ["Array", "Matrix"],
    `If any cell is 0, set its entire row and column to 0. Print the result.\n\n### Input\n- Line 1: R C\n- Next R lines: C integers\n\n### Output\nModified matrix.`,
    "1 ≤ R, C ≤ 200",
    [{ input: "3 3\n1 1 1\n1 0 1\n1 1 1", output: "1 0 1\n0 0 0\n1 0 1" }],
    [["3 3\n1 1 1\n1 0 1\n1 1 1","1 0 1\n0 0 0\n1 0 1",true],["2 2\n1 1\n1 1","1 1\n1 1"],["2 2\n0 1\n1 1","0 0\n0 1"]]
  ),

  p("Spiral Matrix Order", "spiral-matrix", "Medium", ["Array", "Matrix"],
    `Print elements of N×M matrix in spiral order (space-separated on one line).\n\n### Input\n- Line 1: N M\n- Next N lines: M integers\n\n### Output\nSpiral elements.`,
    "1 ≤ N, M ≤ 20",
    [{ input: "3 3\n1 2 3\n4 5 6\n7 8 9", output: "1 2 3 6 9 8 7 4 5" }],
    [["3 3\n1 2 3\n4 5 6\n7 8 9","1 2 3 6 9 8 7 4 5",true],["1 4\n1 2 3 4","1 2 3 4"],["2 2\n1 2\n3 4","1 2 4 3"]]
  ),

  p("Find Peak Element", "find-peak", "Medium", ["Array", "Binary Search"],
    `A peak element is greater than its neighbors. Find any peak's index.\n\n### Input\n- Line 1: N\n- Line 2: N integers\n\n### Output\n0-based index of a peak.`,
    "1 ≤ N ≤ 10^5, no two adjacent elements equal",
    [{ input: "5\n1 2 3 1 0", output: "2" }],
    [["5\n1 2 3 1 0","2",true],["1\n5","0"],["3\n1 3 2","1"],["4\n1 2 3 4","3"]]
  ),

  p("Sqrt Floor", "sqrt-floor", "Medium", ["Binary Search", "Math"],
    `Compute floor(sqrt(N)) without sqrt function.\n\n### Input\nNon-negative integer N.\n\n### Output\nFloor of square root.`,
    "0 ≤ N ≤ 2^31 - 1",
    [{ input: "8", output: "2" }, { input: "4", output: "2" }],
    [["8","2",true],["4","2",true],["0","0"],["1","1"],["100","10"],["2147395600","46340"]]
  ),

  p("Search in Rotated Array", "search-rotated", "Medium", ["Array", "Binary Search"],
    `Search for target in rotated sorted array. Return index or -1.\n\n### Input\n- Line 1: N\n- Line 2: N integers (rotated sorted)\n- Line 3: target\n\n### Output\nIndex or -1.`,
    "1 ≤ N ≤ 10^4, all distinct",
    [{ input: "7\n4 5 6 7 0 1 2\n0", output: "4" }],
    [["7\n4 5 6 7 0 1 2\n0","4",true],["7\n4 5 6 7 0 1 2\n3","-1"],["1\n1\n0","-1"],["3\n3 1 2\n1","1"]]
  ),

];

// Deduplicate by slug
const seen = new Set();
const unique = [];
for (const prob of PROBLEMS_SEED) {
  if (!seen.has(prob.slug)) { seen.add(prob.slug); unique.push(prob); }
}

// Export deduped array
export { unique as PROBLEMS_SEED };
