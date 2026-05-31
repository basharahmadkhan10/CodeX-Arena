const p = (title, slug, description, constraints, examples, testCases, starterCode, titleTags = ["Debugging"]) => ({
  mode: "debugging",
  title,
  slug,
  difficulty: "Medium",
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
    "Debug: Two Sum",
    "debug-two-sum",
    `Given an array of integers and an integer target, return indices of the two numbers such that they add up to target. Fix the bug in the provided code so it returns the indices instead of the values.

### Input
First line: N (number of elements) and Target.
Second line: N space-separated integers.

### Output
Two space-separated indices (0-indexed).`,
    "2 ≤ N ≤ 10^4\n-10^9 ≤ nums[i] ≤ 10^9",
    [{ input: "4 9\n2 7 11 15", output: "0 1", explanation: "nums[0] + nums[1] == 9" }],
    [
      ["4 9\n2 7 11 15", "0 1", true],
      ["3 6\n3 2 4", "1 2", true],
      ["2 6\n3 3", "0 1", false]
    ],
    {
      javascript: `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split(/\\s+/);\nif(input.length < 2) return;\nconst n = Number(input[0]);\nconst target = Number(input[1]);\nconst nums = input.slice(2).map(Number);\n\nconst map = new Map();\nfor (let i = 0; i < n; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n        // BUG: Returning the values instead of indices\n        console.log(complement + " " + nums[i]);\n        return;\n    }\n    map.set(nums[i], i);\n}`,
      python: `import sys\ndata = sys.stdin.read().split()\nif len(data) < 2: sys.exit()\nn, target = int(data[0]), int(data[1])\nnums = [int(x) for x in data[2:]]\n\nseen = {}\nfor i, num in enumerate(nums):\n    complement = target - num\n    if complement in seen:\n        # BUG: Returning values instead of indices\n        print(f"{complement} {num}")\n        sys.exit()\n    seen[num] = i`,
      java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        Map<Integer, Integer> map = new HashMap<>();\n        for(int i=0; i<n; i++) {\n            int num = sc.nextInt();\n            int comp = target - num;\n            if(map.containsKey(comp)) {\n                // BUG: Returning values instead of indices\n                System.out.println(comp + " " + num);\n                return;\n            }\n            map.put(num, i);\n        }\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\nint main() {\n    int n, target;\n    if(!(cin >> n >> target)) return 0;\n    unordered_map<int, int> m;\n    for(int i=0; i<n; i++) {\n        int num; cin >> num;\n        int comp = target - num;\n        if(m.count(comp)) {\n            // BUG: Returning values instead of indices\n            cout << comp << " " << num;\n            return 0;\n        }\n        m[num] = i;\n    }\n    return 0;\n}`,
      c: `#include <stdio.h>\nint main() {\n    int n, target;\n    if(scanf("%d %d", &n, &target) != 2) return 0;\n    int nums[10005];\n    for(int i=0; i<n; i++) scanf("%d", &nums[i]);\n    for(int i=0; i<n; i++) {\n        for(int j=i+1; j<n; j++) {\n            if(nums[i] + nums[j] == target) {\n                // BUG: Returning values instead of indices\n                printf("%d %d", nums[i], nums[j]);\n                return 0;\n            }\n        }\n    }\n    return 0;\n}`
    }
  ),
  p(
    "Debug: Maximum Subarray",
    "debug-maximum-subarray",
    `Given an integer array nums, find the contiguous subarray which has the largest sum and return its sum. Fix the bug where the initial maximum sum is improperly initialized to 0, which fails if all numbers are negative.

### Input
First line: N.
Second line: N space-separated integers.

### Output
The maximum subarray sum.`,
    "1 ≤ N ≤ 10^5\n-10^4 ≤ nums[i] ≤ 10^4",
    [{ input: "5\n-2 -3 -1 -5 -4", output: "-1" }],
    [
      ["5\n-2 -3 -1 -5 -4", "-1", true],
      ["9\n-2 1 -3 4 -1 2 1 -5 4", "6", true],
      ["1\n-5", "-5", false]
    ],
    {
      javascript: `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split(/\\s+/);\nif(input.length < 1) return;\nconst n = Number(input[0]);\nconst nums = input.slice(1).map(Number);\n\n// BUG: initialized to 0, fails if all elements are negative\nlet maxSum = 0;\nlet currentSum = 0;\n\nfor (let i = 0; i < n; i++) {\n    currentSum = Math.max(nums[i], currentSum + nums[i]);\n    maxSum = Math.max(maxSum, currentSum);\n}\nconsole.log(maxSum);`,
      python: `import sys\ndata = sys.stdin.read().split()\nif not data: sys.exit()\nn = int(data[0])\nnums = [int(x) for x in data[1:]]\n\n# BUG: initialized to 0\nmax_sum = 0\ncurr_sum = 0\n\nfor num in nums:\n    curr_sum = max(num, curr_sum + num)\n    max_sum = max(max_sum, curr_sum)\nprint(max_sum)`,
      java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        \n        // BUG: initialized to 0\n        long maxSum = 0;\n        long currentSum = 0;\n        for(int i=0; i<n; i++) {\n            long num = sc.nextLong();\n            currentSum = Math.max(num, currentSum + num);\n            maxSum = Math.max(maxSum, currentSum);\n        }\n        System.out.println(maxSum);\n    }\n}`,
      cpp: `#include <iostream>\n#include <algorithm>\nusing namespace std;\nint main() {\n    int n; if(!(cin >> n)) return 0;\n    // BUG: initialized to 0\n    long long maxSum = 0, currentSum = 0;\n    for(int i=0; i<n; i++) {\n        long long num; cin >> num;\n        currentSum = max(num, currentSum + num);\n        maxSum = max(maxSum, currentSum);\n    }\n    cout << maxSum;\n    return 0;\n}`,
      c: `#include <stdio.h>\nint main() {\n    int n; if(scanf("%d", &n) != 1) return 0;\n    // BUG: initialized to 0\n    long long maxSum = 0, currentSum = 0;\n    for(int i=0; i<n; i++) {\n        long long num; scanf("%lld", &num);\n        if(currentSum + num > num) currentSum += num;\n        else currentSum = num;\n        if(currentSum > maxSum) maxSum = currentSum;\n    }\n    printf("%lld", maxSum);\n    return 0;\n}`
    }
  ),
  p(
    "Debug: Valid Parentheses",
    "debug-valid-parentheses",
    `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Fix the bug where popping from an empty stack isn't checked properly, causing crashes or returning true when it shouldn't.

### Input
A single string containing brackets.

### Output
true if valid, false otherwise.`,
    "1 ≤ |s| ≤ 10^4",
    [{ input: "()[]{}", output: "true" }],
    [
      ["()[]{}", "true", true],
      ["]", "false", true],
      ["([)]", "false", false]
    ],
    {
      javascript: `const fs = require("fs");\nconst s = fs.readFileSync(0, "utf8").trim();\nconst stack = [];\nfor (let i = 0; i < s.length; i++) {\n    const c = s[i];\n    if (c === '(' || c === '{' || c === '[') {\n        stack.push(c);\n    } else {\n        // BUG: doesn't check if stack is empty\n        const top = stack.pop();\n        if (c === ')' && top !== '(') { console.log("false"); return; }\n        if (c === '}' && top !== '{') { console.log("false"); return; }\n        if (c === ']' && top !== '[') { console.log("false"); return; }\n    }\n}\nconsole.log(stack.length === 0 ? "true" : "false");`,
      python: `import sys\ns = sys.stdin.read().strip()\nstack = []\nfor c in s:\n    if c in "({[":\n        stack.append(c)\n    else:\n        # BUG: pops from empty stack without checking, causing IndexError\n        top = stack.pop()\n        if c == ')' and top != '(': \n            print("false")\n            sys.exit()\n        if c == '}' and top != '{': \n            print("false")\n            sys.exit()\n        if c == ']' and top != '[': \n            print("false")\n            sys.exit()\nprint("true" if not stack else "false")`,
      java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNext()) return;\n        String s = sc.next();\n        Stack<Character> st = new Stack<>();\n        for(char c : s.toCharArray()) {\n            if(c=='(' || c=='{' || c=='[') st.push(c);\n            else {\n                // BUG: EmptyStackException if st is empty\n                char top = st.pop();\n                if(c==')' && top!='(') { System.out.println("false"); return; }\n                if(c=='}' && top!='{') { System.out.println("false"); return; }\n                if(c==']' && top!='[') { System.out.println("false"); return; }\n            }\n        }\n        System.out.println(st.isEmpty() ? "true" : "false");\n    }\n}`,
      cpp: `#include <iostream>\n#include <stack>\nusing namespace std;\nint main() {\n    string s; cin >> s;\n    stack<char> st;\n    for(char c : s) {\n        if(c=='(' || c=='{' || c=='[') st.push(c);\n        else {\n            // BUG: undefined behavior if stack is empty\n            char top = st.top(); st.pop();\n            if(c==')' && top!='(') { cout << "false"; return 0; }\n            if(c=='}' && top!='{') { cout << "false"; return 0; }\n            if(c==']' && top!='[') { cout << "false"; return 0; }\n        }\n    }\n    if(st.empty()) cout << "true"; else cout << "false";\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\nint main() {\n    char s[10005];\n    if(scanf("%s", s) != 1) return 0;\n    char stack[10005]; int top = 0;\n    for(int i=0; s[i]; i++) {\n        char c = s[i];\n        if(c=='(' || c=='{' || c=='[') stack[top++] = c;\n        else {\n            // BUG: reads out of bounds if top == 0\n            char t = stack[--top];\n            if(c==')' && t!='(') { printf("false"); return 0; }\n            if(c=='}' && t!='{') { printf("false"); return 0; }\n            if(c==']' && t!='[') { printf("false"); return 0; }\n        }\n    }\n    if(top == 0) printf("true"); else printf("false");\n    return 0;\n}`
    }
  ),
  p(
    "Debug: Container With Most Water",
    "debug-container-most-water",
    `Given N non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap. The provided two-pointer solution moves the wrong pointer. Fix it.

### Input
First line: N.
Second line: N space-separated integers.

### Output
Maximum area of water.`,
    "2 ≤ N ≤ 10^5",
    [{ input: "9\n1 8 6 2 5 4 8 3 7", output: "49" }],
    [
      ["9\n1 8 6 2 5 4 8 3 7", "49", true],
      ["2\n1 1", "1", true],
      ["4\n4 3 2 1", "4", false]
    ],
    {
      javascript: `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split(/\\s+/);\nif(input.length < 1) return;\nconst n = Number(input[0]);\nconst height = input.slice(1).map(Number);\n\nlet left = 0, right = n - 1;\nlet maxArea = 0;\nwhile (left < right) {\n    const h = Math.min(height[left], height[right]);\n    maxArea = Math.max(maxArea, h * (right - left));\n    // BUG: Moves the larger pointer instead of the smaller pointer\n    if (height[left] > height[right]) {\n        left++;\n    } else {\n        right--;\n    }\n}\nconsole.log(maxArea);`,
      python: `import sys\ndata = sys.stdin.read().split()\nif not data: sys.exit()\nn = int(data[0])\nheight = [int(x) for x in data[1:]]\n\nleft, right = 0, n - 1\nmax_area = 0\nwhile left < right:\n    h = min(height[left], height[right])\n    max_area = max(max_area, h * (right - left))\n    # BUG: Moves the larger pointer instead of the smaller one\n    if height[left] > height[right]:\n        left += 1\n    else:\n        right -= 1\nprint(max_area)`,
      java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] height = new int[n];\n        for(int i=0; i<n; i++) height[i] = sc.nextInt();\n        \n        int left = 0, right = n - 1;\n        long maxArea = 0;\n        while (left < right) {\n            long h = Math.min(height[left], height[right]);\n            maxArea = Math.max(maxArea, h * (right - left));\n            // BUG: Moves the larger pointer\n            if (height[left] > height[right]) {\n                left++;\n            } else {\n                right--;\n            }\n        }\n        System.out.println(maxArea);\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n; if(!(cin >> n)) return 0;\n    vector<int> height(n);\n    for(int &x : height) cin >> x;\n    int left = 0, right = n - 1;\n    long long maxArea = 0;\n    while(left < right) {\n        long long h = min(height[left], height[right]);\n        maxArea = max(maxArea, h * (right - left));\n        // BUG: Moves the larger pointer\n        if(height[left] > height[right]) left++;\n        else right--;\n    }\n    cout << maxArea;\n    return 0;\n}`,
      c: `#include <stdio.h>\nint min(int a, int b) { return a < b ? a : b; }\nint main() {\n    int n; if(scanf("%d", &n) != 1) return 0;\n    int height[100005];\n    for(int i=0; i<n; i++) scanf("%d", &height[i]);\n    int left = 0, right = n - 1;\n    long long maxArea = 0;\n    while(left < right) {\n        long long h = min(height[left], height[right]);\n        long long area = h * (right - left);\n        if(area > maxArea) maxArea = area;\n        // BUG: Moves the larger pointer\n        if(height[left] > height[right]) left++;\n        else right--;\n    }\n    printf("%lld", maxArea);\n    return 0;\n}`
    }
  ),
  p(
    "Debug: Search in Rotated Sorted Array",
    "debug-search-rotated",
    `There is an integer array nums sorted in ascending order (with distinct values) which is rotated. Given a target, print its index, or -1 if not found. Fix the bug in the binary search boundary conditions.

### Input
First line: N and Target.
Second line: N integers.

### Output
Index of the target, or -1.`,
    "1 ≤ N ≤ 5000",
    [{ input: "7 0\n4 5 6 7 0 1 2", output: "4" }],
    [
      ["7 0\n4 5 6 7 0 1 2", "4", true],
      ["7 3\n4 5 6 7 0 1 2", "-1", true],
      ["1 0\n1", "-1", false]
    ],
    {
      javascript: `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split(/\\s+/);\nif(input.length < 2) return;\nconst n = Number(input[0]);\nconst target = Number(input[1]);\nconst nums = input.slice(2).map(Number);\n\nlet left = 0, right = n - 1;\nwhile (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (nums[mid] === target) { console.log(mid); return; }\n    if (nums[left] <= nums[mid]) {\n        // BUG: Missed the equality check for nums[left] <= target\n        if (nums[left] < target && target < nums[mid]) {\n            right = mid - 1;\n        } else {\n            left = mid + 1;\n        }\n    } else {\n        if (nums[mid] < target && target <= nums[right]) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n}\nconsole.log("-1");`,
      python: `import sys\ndata = sys.stdin.read().split()\nif len(data) < 2: sys.exit()\nn, target = int(data[0]), int(data[1])\nnums = [int(x) for x in data[2:]]\n\nleft, right = 0, n - 1\nwhile left <= right:\n    mid = (left + right) // 2\n    if nums[mid] == target:\n        print(mid)\n        sys.exit()\n    if nums[left] <= nums[mid]:\n        # BUG: Missing equality check for nums[left]\n        if nums[left] < target and target < nums[mid]:\n            right = mid - 1\n        else:\n            left = mid + 1\n    else:\n        if nums[mid] < target and target <= nums[right]:\n            left = mid + 1\n        else:\n            right = mid - 1\nprint("-1")`,
      java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNextInt()) return;\n        int n = sc.nextInt(), target = sc.nextInt();\n        int[] nums = new int[n];\n        for(int i=0; i<n; i++) nums[i] = sc.nextInt();\n        int left = 0, right = n - 1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (nums[mid] == target) { System.out.println(mid); return; }\n            if (nums[left] <= nums[mid]) {\n                // BUG: Missing equality for left\n                if (nums[left] < target && target < nums[mid]) right = mid - 1;\n                else left = mid + 1;\n            } else {\n                if (nums[mid] < target && target <= nums[right]) left = mid + 1;\n                else right = mid - 1;\n            }\n        }\n        System.out.println("-1");\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n, target; if(!(cin >> n >> target)) return 0;\n    vector<int> nums(n);\n    for(int &x : nums) cin >> x;\n    int left = 0, right = n - 1;\n    while(left <= right) {\n        int mid = left + (right - left) / 2;\n        if(nums[mid] == target) { cout << mid; return 0; }\n        if(nums[left] <= nums[mid]) {\n            // BUG: Missing equality\n            if(nums[left] < target && target < nums[mid]) right = mid - 1;\n            else left = mid + 1;\n        } else {\n            if(nums[mid] < target && target <= nums[right]) left = mid + 1;\n            else right = mid - 1;\n        }\n    }\n    cout << -1;\n    return 0;\n}`,
      c: `#include <stdio.h>\nint main() {\n    int n, target; if(scanf("%d %d", &n, &target) != 2) return 0;\n    int nums[5005];\n    for(int i=0; i<n; i++) scanf("%d", &nums[i]);\n    int left = 0, right = n - 1;\n    while(left <= right) {\n        int mid = left + (right - left) / 2;\n        if(nums[mid] == target) { printf("%d", mid); return 0; }\n        if(nums[left] <= nums[mid]) {\n            // BUG: Missing equality\n            if(nums[left] < target && target < nums[mid]) right = mid - 1;\n            else left = mid + 1;\n        } else {\n            if(nums[mid] < target && target <= nums[right]) left = mid + 1;\n            else right = mid - 1;\n        }\n    }\n    printf("-1");\n    return 0;\n}`
    }
  ),
  p(
    "Debug: Merge Intervals",
    "debug-merge-intervals",
    `Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals. The code has a bug where it fails to sort the intervals properly before merging. Fix it.

### Input
First line: N (number of intervals).
Next N lines: start and end of each interval.

### Output
Merged intervals, each on a new line.`,
    "1 ≤ N ≤ 10^4",
    [{ input: "4\n1 3\n2 6\n8 10\n15 18", output: "1 6\n8 10\n15 18" }],
    [
      ["4\n1 3\n2 6\n8 10\n15 18", "1 6\n8 10\n15 18", true],
      ["2\n1 4\n4 5", "1 5", true],
      ["3\n1 4\n0 4\n5 6", "0 4\n5 6", false]
    ],
    {
      javascript: `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split(/\\s+/);\nif(input.length < 1) return;\nconst n = Number(input[0]);\nlet ptr = 1;\nconst intervals = [];\nfor(let i=0; i<n; i++) intervals.push([Number(input[ptr++]), Number(input[ptr++])]);\n\n// BUG: Sorting by end time instead of start time\nintervals.sort((a, b) => a[1] - b[1]);\n\nconst merged = [intervals[0]];\nfor(let i=1; i<n; i++) {\n    const last = merged[merged.length - 1];\n    if(intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);\n    else merged.push(intervals[i]);\n}\nmerged.forEach(i => console.log(i[0] + " " + i[1]));`,
      python: `import sys\ndata = sys.stdin.read().split()\nif not data: sys.exit()\nn = int(data[0])\nintervals = []\nptr = 1\nfor _ in range(n):\n    intervals.append([int(data[ptr]), int(data[ptr+1])])\n    ptr += 2\n\n# BUG: Sorting by end time instead of start time\nintervals.sort(key=lambda x: x[1])\n\nmerged = [intervals[0]]\nfor i in range(1, n):\n    last = merged[-1]\n    if intervals[i][0] <= last[1]:\n        last[1] = max(last[1], intervals[i][1])\n    else:\n        merged.append(intervals[i])\nfor m in merged:\n    print(f"{m[0]} {m[1]}")`,
      java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[][] intervals = new int[n][2];\n        for(int i=0; i<n; i++) {\n            intervals[i][0] = sc.nextInt();\n            intervals[i][1] = sc.nextInt();\n        }\n        // BUG: Sorting by end time\n        Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));\n        List<int[]> merged = new ArrayList<>();\n        merged.add(intervals[0]);\n        for(int i=1; i<n; i++) {\n            int[] last = merged.get(merged.size()-1);\n            if(intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);\n            else merged.add(intervals[i]);\n        }\n        for(int[] m : merged) System.out.println(m[0] + " " + m[1]);\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    int n; if(!(cin >> n)) return 0;\n    vector<pair<int, int>> intervals(n);\n    for(int i=0; i<n; i++) cin >> intervals[i].first >> intervals[i].second;\n    // BUG: Sorting by end time (custom lambda needed if pair, but default is first which is fine, wait let's add bug)\n    sort(intervals.begin(), intervals.end(), [](pair<int,int> a, pair<int,int> b){ return a.second < b.second; });\n    vector<pair<int,int>> merged;\n    merged.push_back(intervals[0]);\n    for(int i=1; i<n; i++) {\n        auto &last = merged.back();\n        if(intervals[i].first <= last.second) last.second = max(last.second, intervals[i].second);\n        else merged.push_back(intervals[i]);\n    }\n    for(auto m : merged) cout << m.first << " " << m.second << "\\n";\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <stdlib.h>\ntypedef struct { int s, e; } Interval;\nint cmp(const void *a, const void *b) {\n    // BUG: Sorting by end time\n    return ((Interval*)a)->e - ((Interval*)b)->e;\n}\nint main() {\n    int n; if(scanf("%d", &n) != 1) return 0;\n    Interval arr[10005];\n    for(int i=0; i<n; i++) scanf("%d %d", &arr[i].s, &arr[i].e);\n    qsort(arr, n, sizeof(Interval), cmp);\n    Interval merged[10005];\n    int mCount = 0;\n    merged[mCount++] = arr[0];\n    for(int i=1; i<n; i++) {\n        if(arr[i].s <= merged[mCount-1].e) {\n            if(arr[i].e > merged[mCount-1].e) merged[mCount-1].e = arr[i].e;\n        } else merged[mCount++] = arr[i];\n    }\n    for(int i=0; i<mCount; i++) printf("%d %d\\n", merged[i].s, merged[i].e);\n    return 0;\n}`
    }
  ),
  p(
    "Debug: Coin Change",
    "debug-coin-change",
    `Given an array of coins and a target amount, return the fewest number of coins that you need to make up that amount. If not possible, return -1. The DP array initialization is buggy. Fix it.

### Input
First line: N and Amount.
Second line: N integers representing coin denominations.

### Output
Minimum coins needed, or -1.`,
    "1 ≤ N ≤ 12\n0 ≤ Amount ≤ 10^4",
    [{ input: "3 11\n1 2 5", output: "3", explanation: "11 = 5 + 5 + 1" }],
    [
      ["3 11\n1 2 5", "3", true],
      ["1 3\n2", "-1", true],
      ["1 0\n1", "0", false]
    ],
    {
      javascript: `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split(/\\s+/);\nif(input.length < 2) return;\nconst n = Number(input[0]);\nconst amount = Number(input[1]);\nconst coins = input.slice(2).map(Number);\n\n// BUG: initialized with 0 instead of Infinity\nconst dp = Array(amount + 1).fill(0);\ndp[0] = 0;\nfor (let i = 1; i <= amount; i++) {\n    for (let c of coins) {\n        if (i - c >= 0) {\n            dp[i] = Math.min(dp[i], dp[i - c] + 1);\n        }\n    }\n}\nconsole.log(dp[amount] === 0 && amount !== 0 ? -1 : dp[amount]);`,
      python: `import sys\ndata = sys.stdin.read().split()\nif len(data) < 2: sys.exit()\nn, amount = int(data[0]), int(data[1])\ncoins = [int(x) for x in data[2:]]\n\n# BUG: initialized with 0 instead of infinity\ndp = [0] * (amount + 1)\nfor i in range(1, amount + 1):\n    for c in coins:\n        if i - c >= 0:\n            dp[i] = min(dp[i], dp[i - c] + 1)\n\nif dp[amount] == 0 and amount != 0: print(-1)\nelse: print(dp[amount])`,
      java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int amount = sc.nextInt();\n        int[] coins = new int[n];\n        for(int i=0; i<n; i++) coins[i] = sc.nextInt();\n        \n        // BUG: initialized with 0\n        int[] dp = new int[amount + 1];\n        for(int i=1; i<=amount; i++) {\n            for(int c : coins) {\n                if(i - c >= 0) dp[i] = Math.min(dp[i], dp[i - c] + 1);\n            }\n        }\n        if(dp[amount] == 0 && amount != 0) System.out.println("-1");\n        else System.out.println(dp[amount]);\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    int n, amount; if(!(cin >> n >> amount)) return 0;\n    vector<int> coins(n);\n    for(int &x : coins) cin >> x;\n    // BUG: initialized with 0\n    vector<int> dp(amount + 1, 0);\n    for(int i=1; i<=amount; i++) {\n        for(int c : coins) {\n            if(i - c >= 0) dp[i] = min(dp[i], dp[i - c] + 1);\n        }\n    }\n    if(dp[amount] == 0 && amount != 0) cout << -1;\n    else cout << dp[amount];\n    return 0;\n}`,
      c: `#include <stdio.h>\n#define MIN(a,b) ((a)<(b)?(a):(b))\nint main() {\n    int n, amount; if(scanf("%d %d", &n, &amount) != 2) return 0;\n    int coins[15];\n    for(int i=0; i<n; i++) scanf("%d", &coins[i]);\n    int dp[10005] = {0}; // BUG: initialized with 0\n    for(int i=1; i<=amount; i++) {\n        for(int j=0; j<n; j++) {\n            if(i - coins[j] >= 0) dp[i] = MIN(dp[i], dp[i - coins[j]] + 1);\n        }\n    }\n    if(dp[amount] == 0 && amount != 0) printf("-1");\n    else printf("%d", dp[amount]);\n    return 0;\n}`
    }
  ),
  p(
    "Debug: Longest Substring Without Repeating Characters",
    "debug-longest-substring",
    `Given a string s, find the length of the longest substring without repeating characters. Fix the sliding window bug where the left pointer doesn't jump correctly.

### Input
A single string.

### Output
Integer representing the length.`,
    "0 ≤ |s| ≤ 5 * 10^4",
    [{ input: "abcabcbb", output: "3" }],
    [
      ["abcabcbb", "3", true],
      ["bbbbb", "1", true],
      ["pwwkew", "3", false]
    ],
    {
      javascript: `const fs = require("fs");\nconst s = fs.readFileSync(0, "utf8").trim();\nconst map = new Map();\nlet maxLen = 0, left = 0;\nfor(let i=0; i<s.length; i++) {\n    if(map.has(s[i])) {\n        // BUG: should be Math.max(left, map.get(s[i]) + 1)\n        left = map.get(s[i]) + 1;\n    }\n    map.set(s[i], i);\n    maxLen = Math.max(maxLen, i - left + 1);\n}\nconsole.log(maxLen);`,
      python: `import sys\ns = sys.stdin.read().strip()\nseen = {}\nmax_len = 0\nleft = 0\nfor i, c in enumerate(s):\n    if c in seen:\n        # BUG: left pointer goes backward if seen[c] is outside current window\n        left = seen[c] + 1\n    seen[c] = i\n    max_len = max(max_len, i - left + 1)\nprint(max_len)`,
      java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNext()) return;\n        String s = sc.next();\n        Map<Character, Integer> map = new HashMap<>();\n        int maxLen = 0, left = 0;\n        for(int i=0; i<s.length(); i++) {\n            char c = s.charAt(i);\n            if(map.containsKey(c)) {\n                // BUG: left pointer can go backward\n                left = map.get(c) + 1;\n            }\n            map.put(c, i);\n            maxLen = Math.max(maxLen, i - left + 1);\n        }\n        System.out.println(maxLen);\n    }\n}`,
      cpp: `#include <iostream>\n#include <string>\n#include <unordered_map>\nusing namespace std;\nint main() {\n    string s; if(!(cin >> s)) return 0;\n    unordered_map<char, int> m;\n    int maxLen = 0, left = 0;\n    for(int i=0; i<s.size(); i++) {\n        if(m.count(s[i])) {\n            // BUG: left can go backward\n            left = m[s[i]] + 1;\n        }\n        m[s[i]] = i;\n        maxLen = max(maxLen, i - left + 1);\n    }\n    cout << maxLen;\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\nint max(int a, int b) { return a > b ? a : b; }\nint main() {\n    char s[50005]; if(scanf("%s", s) != 1) return 0;\n    int m[256]; for(int i=0; i<256; i++) m[i] = -1;\n    int maxLen = 0, left = 0;\n    for(int i=0; s[i]; i++) {\n        if(m[(unsigned char)s[i]] != -1) {\n            // BUG: left can go backward\n            left = m[(unsigned char)s[i]] + 1;\n        }\n        m[(unsigned char)s[i]] = i;\n        maxLen = max(maxLen, i - left + 1);\n    }\n    printf("%d", maxLen);\n    return 0;\n}`
    }
  ),
  p(
    "Debug: Longest Increasing Subsequence",
    "debug-longest-increasing-subsequence",
    `Given an integer array nums, return the length of the longest strictly increasing subsequence. The given DP solution has a bug in its inner loop condition. Fix it.

### Input
First line: N.
Second line: N space-separated integers.

### Output
The length of LIS.`,
    "1 ≤ N ≤ 2500\n-10^4 ≤ nums[i] ≤ 10^4",
    [{ input: "8\n10 9 2 5 3 7 101 18", output: "4" }],
    [
      ["8\n10 9 2 5 3 7 101 18", "4", true],
      ["6\n0 1 0 3 2 3", "4", true],
      ["1\n7", "1", false]
    ],
    {
      javascript: `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split(/\\s+/);\nif(input.length < 1) return;\nconst n = Number(input[0]);\nconst nums = input.slice(1).map(Number);\n\nconst dp = Array(n).fill(1);\nlet maxAns = 1;\nfor(let i = 1; i < n; i++) {\n    // BUG: j should only go up to i, not n\n    for(let j = 0; j < n; j++) {\n        if(nums[i] > nums[j]) {\n            dp[i] = Math.max(dp[i], dp[j] + 1);\n        }\n    }\n    maxAns = Math.max(maxAns, dp[i]);\n}\nconsole.log(maxAns);`,
      python: `import sys\ndata = sys.stdin.read().split()\nif not data: sys.exit()\nn = int(data[0])\nnums = [int(x) for x in data[1:]]\n\ndp = [1] * n\nmax_ans = 1\nfor i in range(1, n):\n    # BUG: j goes up to n instead of i\n    for j in range(n):\n        if nums[i] > nums[j]:\n            dp[i] = max(dp[i], dp[j] + 1)\n    max_ans = max(max_ans, dp[i])\nprint(max_ans)`,
      java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for(int i=0; i<n; i++) nums[i] = sc.nextInt();\n        \n        int[] dp = new int[n];\n        Arrays.fill(dp, 1);\n        int maxAns = 1;\n        for(int i=1; i<n; i++) {\n            // BUG: inner loop goes to n\n            for(int j=0; j<n; j++) {\n                if(nums[i] > nums[j]) dp[i] = Math.max(dp[i], dp[j] + 1);\n            }\n            maxAns = Math.max(maxAns, dp[i]);\n        }\n        System.out.println(maxAns);\n    }\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    int n; if(!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for(int &x : nums) cin >> x;\n    vector<int> dp(n, 1);\n    int maxAns = 1;\n    for(int i=1; i<n; i++) {\n        // BUG: j goes to n\n        for(int j=0; j<n; j++) {\n            if(nums[i] > nums[j]) dp[i] = max(dp[i], dp[j] + 1);\n        }\n        maxAns = max(maxAns, dp[i]);\n    }\n    cout << maxAns;\n    return 0;\n}`,
      c: `#include <stdio.h>\nint max(int a, int b) { return a > b ? a : b; }\nint main() {\n    int n; if(scanf("%d", &n) != 1) return 0;\n    int nums[2505], dp[2505];\n    for(int i=0; i<n; i++) {\n        scanf("%d", &nums[i]);\n        dp[i] = 1;\n    }\n    int maxAns = 1;\n    for(int i=1; i<n; i++) {\n        // BUG: j goes to n\n        for(int j=0; j<n; j++) {\n            if(nums[i] > nums[j]) dp[i] = max(dp[i], dp[j] + 1);\n        }\n        maxAns = max(maxAns, dp[i]);\n    }\n    printf("%d", maxAns);\n    return 0;\n}`
    }
  ),
  p(
    "Debug: Word Break",
    "debug-word-break",
    `Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of dictionary words. The DP solution has a bug regarding the initialization state. Fix it.

### Input
First line: String S.
Second line: N (number of words in dictionary).
Third line: N space-separated words.

### Output
true or false.`,
    "1 ≤ |s| ≤ 300\n1 ≤ N ≤ 1000",
    [{ input: "leetcode\n2\nleet code", output: "true" }],
    [
      ["leetcode\n2\nleet code", "true", true],
      ["applepenapple\n2\napple pen", "true", true],
      ["catsandog\n5\ncats dog sand and cat", "false", false]
    ],
    {
      javascript: `const fs = require("fs");\nconst input = fs.readFileSync(0, "utf8").trim().split(/\\s+/);\nif(input.length < 2) return;\nconst s = input[0];\nconst n = Number(input[1]);\nconst dict = new Set(input.slice(2));\n\nconst dp = Array(s.length + 1).fill(false);\n// BUG: Missing dp[0] = true;\nfor (let i = 1; i <= s.length; i++) {\n    for (let j = 0; j < i; j++) {\n        if (dp[j] && dict.has(s.substring(j, i))) {\n            dp[i] = true;\n            break;\n        }\n    }\n}\nconsole.log(dp[s.length] ? "true" : "false");`,
      python: `import sys\ndata = sys.stdin.read().split()\nif len(data) < 2: sys.exit()\ns = data[0]\nn = int(data[1])\ndict_set = set(data[2:])\n\ndp = [False] * (len(s) + 1)\n# BUG: Missing dp[0] = True\nfor i in range(1, len(s) + 1):\n    for j in range(i):\n        if dp[j] and s[j:i] in dict_set:\n            dp[i] = True\n            break\nprint("true" if dp[len(s)] else "false")`,
      java: `import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNext()) return;\n        String s = sc.next();\n        int n = sc.nextInt();\n        Set<String> dict = new HashSet<>();\n        for(int i=0; i<n; i++) dict.add(sc.next());\n        \n        boolean[] dp = new boolean[s.length() + 1];\n        // BUG: Missing dp[0] = true\n        for(int i=1; i<=s.length(); i++) {\n            for(int j=0; j<i; j++) {\n                if(dp[j] && dict.contains(s.substring(j, i))) {\n                    dp[i] = true;\n                    break;\n                }\n            }\n        }\n        System.out.println(dp[s.length()] ? "true" : "false");\n    }\n}`,
      cpp: `#include <iostream>\n#include <string>\n#include <unordered_set>\n#include <vector>\nusing namespace std;\nint main() {\n    string s; if(!(cin >> s)) return 0;\n    int n; cin >> n;\n    unordered_set<string> dict;\n    for(int i=0; i<n; i++) { string w; cin >> w; dict.insert(w); }\n    vector<bool> dp(s.length() + 1, false);\n    // BUG: Missing dp[0] = true\n    for(int i=1; i<=s.length(); i++) {\n        for(int j=0; j<i; j++) {\n            if(dp[j] && dict.count(s.substr(j, i - j))) {\n                dp[i] = true;\n                break;\n            }\n        }\n    }\n    cout << (dp[s.length()] ? "true" : "false");\n    return 0;\n}`,
      c: `#include <stdio.h>\n#include <string.h>\nint main() {\n    char s[305]; if(scanf("%s", s) != 1) return 0;\n    int n; scanf("%d", &n);\n    char dict[1005][305];\n    for(int i=0; i<n; i++) scanf("%s", dict[i]);\n    int len = strlen(s);\n    int dp[305] = {0};\n    // BUG: Missing dp[0] = 1\n    for(int i=1; i<=len; i++) {\n        for(int j=0; j<i; j++) {\n            if(dp[j]) {\n                char sub[305];\n                strncpy(sub, s + j, i - j);\n                sub[i - j] = '\\0';\n                for(int k=0; k<n; k++) {\n                    if(strcmp(dict[k], sub) == 0) { dp[i] = 1; break; }\n                }\n                if(dp[i]) break;\n            }\n        }\n    }\n    if(dp[len]) printf("true"); else printf("false");\n    return 0;\n}`
    }
  )
];
