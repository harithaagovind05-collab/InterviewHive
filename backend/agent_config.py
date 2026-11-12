SERVICE = "InterviewHive Agent"
HOST = "0.0.0.0"
PORT = 8000

QUESTION_POOL = [
    {"id": "qs-easy-java-01", "question": "What is inheritance in Java?", "topic": "inheritance", "concept": "class inheritance", "difficulty": "easy", "language": "Java"},
    {"id": "qs-easy-java-02", "question": "Explain the difference between == and .equals() in Java.", "topic": "string comparison", "concept": "reference vs value equality", "difficulty": "easy", "language": "Java"},
    {"id": "qs-medium-java-01", "question": "What are interfaces and abstract classes in Java? When should you use each?", "topic": "inheritance", "concept": "interfaces vs abstract classes", "difficulty": "medium", "language": "Java"},
    {"id": "qs-hard-java-01", "question": "Design a thread-safe cache using ConcurrentHashMap. Explain concurrency risks and your design choices.", "topic": "concurrency", "concept": "thread-safe collections", "difficulty": "hard", "language": "Java"},
    {"id": "qs-easy-python-01", "question": "What is a list comprehension in Python? Give an example.", "topic": "syntax", "concept": "list comprehension", "difficulty": "easy", "language": "Python"},
    {"id": "qs-medium-python-01", "question": "How does Python's GIL affect multi-threaded performance?", "topic": "concurrency", "concept": "GIL", "difficulty": "medium", "language": "Python"},
    {"id": "qs-medium-python-02", "question": "Explain Python's pass-by-object-reference behavior with mutable and immutable types.", "topic": "variables", "concept": "reference semantics", "difficulty": "medium", "language": "Python"},
    {"id": "qs-hard-python-01", "question": "Implement a decorator that measures function execution time. Handle nested function calls safely.", "topic": "advanced syntax", "concept": "decorators", "difficulty": "hard", "language": "Python"},
    {"id": "qs-easy-cpp-01", "question": "What is a pointer in C++? How does it differ from a reference?", "topic": "memory", "concept": "pointers vs references", "difficulty": "easy", "language": "C++"},
    {"id": "qs-medium-cpp-01", "question": "Explain RAII and how destructors manage resources in C++.", "topic": "resource management", "concept": "RAII", "difficulty": "medium", "language": "C++"},
    {"id": "qs-medium-cpp-02", "question": "Compare virtual inheritance and regular inheritance in C++. When is virtual inheritance needed?", "topic": "inheritance", "concept": "virtual inheritance", "difficulty": "medium", "language": "C++"},
    {"id": "qs-hard-cpp-01", "question": "Write a move constructor and move assignment operator for a resource-owning class. Explain when the compiler generates them automatically.", "topic": "advanced C++", "concept": "move semantics", "difficulty": "hard", "language": "C++"},
    # General/conceptual (cross-language) — can be used as follow-up or deeper for any language
    {"id": "qs-followup-time-01", "question": "Compare quicksort, mergesort, and heapsort. When would you choose each?", "topic": "sorting algorithms comparison", "concept": "algorithm comparison", "difficulty": "medium", "language": "General"},
    {"id": "qs-deeper-graph-01", "question": "Compare adjacency lists and adjacency matrices for graph representation. Trade-offs?", "topic": "graph representation", "concept": "data structure comparison", "difficulty": "medium", "language": "General"},
    {"id":"qs-easier-basics-01","question":"What is the difference between a process and a thread?","topic":"operating systems","concept":"process vs thread","difficulty":"easy","language":"General"},
    # Coding / compiler-enabled questions
    {"id":"qs-code-java-01","question":"Write a Java method to reverse a String. Handle null input.","topic":"coding","concept":"string reversal","difficulty":"easy","language":"Java"},
    {"id":"qs-code-python-01","question":"Write a Python function to find the second largest number in a list.","topic":"coding","concept":"list logic","difficulty":"easy","language":"Python"},
    {"id":"qs-code-cpp-01","question":"Write a C++ function to swap two integers using pointers.","topic":"coding","concept":"pointer swap","difficulty":"easy","language":"C++"},
    {"id":"qs-code-java-02","question":"Implement a basic Java class for a Stack using an array.","topic":"coding","concept":"data structure","difficulty":"medium","language":"Java"},
    {"id":"qs-code-python-02","question":"Write a Python script that reads a file, counts lines, and prints the result.","topic":"coding","concept":"file io","difficulty":"medium","language":"Python"},
    {"id":"qs-code-cpp-02","question":"Write a C++ program that calculates factorial using recursion.","topic":"coding","concept":"recursion","difficulty":"medium","language":"C++"},
]
