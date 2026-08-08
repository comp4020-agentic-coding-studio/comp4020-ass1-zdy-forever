# Assignment 1 reflection

**What was the breakthrough that moved the work forward?**

After the Week 2 crit, I put almost every requirement into `CLAUDE.md`. I
thought more context would make the agent more reliable, but the opposite often
happened: the context filled quickly, token usage grew rapidly, and the agent
had to carry too much information into each small task. For this assignment, I
changed my strategy. I explained only the current task and the constraints that
directly affected it. This made context usage much more manageable and kept the
conversation focused.

However, being brief introduced a different problem. When I left design choices
open, the agent sometimes produced interfaces that worked but did not match the
style I had imagined. My breakthrough was realising that the answer is not
simply “give less context.” A better approach is to first turn my natural-language
ideas into a short, structured brief—sometimes using an online GPT to organise
them—and then give that precise brief to the coding agent. This preserves
context without giving away important design intent.

**What did this work change about who I want to be as a software developer?**

I want to work in small, testable iterations instead of asking an agent to build
the complete product in one attempt. This week I spent about A$30 on tokens
across discarded versions. Because the agent was producing near-finished work
rather than disposable demos, every failed direction was expensive to replace.
Breaking the project into focused tasks let me review one decision at a time,
correct problems earlier, and commit each successful improvement separately. It
also kept the context understandable for both me and the agent. I now see task
decomposition not only as project management, but as an essential part of
working responsibly with AI-assisted development.
