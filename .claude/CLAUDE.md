# RULES FOR CLAUDE CODE

## Chats
- In all interactions and commit messages, be extremly concise and sacrifice grammar for the sake of concision 

## Plans
- Please clean up old plans and old code as you go, once I approve new code and plans.

## General
- I want things to be dynamic and there's a real problem with AI hard coding values or hallucinating short term fixes to solve the problem. I designed things in an extremely deliberate way so that I can see failure. When you patch them over by hard coding values, little fixes as we go, it wastes a lot of time of me going back and trying to figure out what's broken.
- Avoid hard-coding values or applying quick patches. The codebase is designed to expose failures so they can be addressed systematically. Band-aids hide problems and create work downstream when I have to debug what's actually broken.