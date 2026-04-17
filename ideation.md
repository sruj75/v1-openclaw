# Ideation

This document is the running source of truth for the idea-shaping process.
We will use it to prevent context loss while we walk the design tree one
decision at a time.

## Current Status

- Stage: human-in-the-loop v1 shape emerging, minimum end-to-end loop unresolved
- Mode: grill-me
- Repo context: very early project, minimal codebase present
- Source of truth for scope: this file

## Raw Idea

Intentive helps you start the work you avoid and recover faster when you derail.

For people with executive dysfunction, ADHD, or workdays that collapse at the
moment of action.

Most tools help you plan.
Intentive helps when the plan meets real life.

It checks in at the right moment, helps you take the first step, and rescues
you before one bad hour becomes a lost day.

You probably do not need another planner.
You already know what matters.

The hard part is what happens next:

- you delay starting
- a small interruption breaks momentum
- one avoided task turns into a lost block
- guilt builds and the whole day slips

Intentive is built for that moment.

### How It Works

1. Choose your important work blocks
   Tell Intentive what matters today.
2. Get a check-in at the right moment
   When the block starts, Intentive helps you define the first tiny step.
3. Get rescued if you stall
   If you freeze, avoid, or drift, Intentive steps in with the right prompt to
   get you moving again.
4. It learns what works for you
   Over time, it adapts to your timing, your blockers, and the type of nudge
   that actually helps.

### Why It Is Different

Other tools store intentions.
Intentive intervenes at the point of failure.

That means:

- less silent drift
- faster starts
- quicker recovery after derailment
- more important work actually getting done

### Who It Is For

Intentive is for people who:

- know what they should do
- still struggle to start
- lose time in transitions, avoidance, or overwhelm
- want support in the moment, not just another list

Especially useful for:

- ADHD / executive dysfunction
- founders and operators
- knowledge workers under high cognitive load

### Benefit Section

What you get:

- help starting important work
- rescue when momentum breaks
- less guilt from silent avoidance
- a system that learns your friction patterns
- support that shows up before the day fully collapses

### Trust / Framing Section

Not just reminders. Not another to-do app.
Intentive is a proactive execution scaffold: a system designed to help turn
intention into action when friction would normally win.

Start the work you avoid. Recover faster when you derail.

## Working Hypothesis

Intentive is not a planning tool. It is an in-the-moment execution support
system that intervenes when intention is about to fail, especially at start
friction, post-interruption drift, and shame spirals after avoidance.

## Decision Tree

### 1. Foundation

- What is the thing?
- Who is it for?
- What painful problem does it solve?
- Why now?

### 2. Outcome

- What does success look like?
- What changes for the user after using it?
- What is the smallest useful version?

### 3. Constraints

- What resources, deadlines, and technical limits matter?
- What should this explicitly not do?

### 4. Delivery

- What needs to exist first?
- What can wait?
- What proof would justify building further?

## Questions Log

### Q1

- Question: What is the idea in one sentence?
- Recommendation: Use the format "For [user], this helps them [outcome] by [mechanism]."
- Status: answered

### Q2

- Question: Who is the first specific user we are designing for at launch?
- Recommendation: Start with one wedge user, ideally "knowledge workers with ADHD or executive dysfunction who already know their priorities but fail at starting solo deep-work blocks."
- Status: deferred pending v1 proof target

### Q3

- Question: What is v1 actually trying to prove first: the user intervention loop or the multi-user runtime architecture?
- Recommendation: Prove the intervention loop first, while keeping the architecture just strong enough to support isolated users in the background.
- Status: partially answered by new human-in-the-loop direction

### Q4

- Question: Is the psychologist or behavioral expert required for every v1 user, or is that optional support around a self-serve product?
- Recommendation: For v1, make the expert required for every user so the human owns strategy, the agent owns between-session execution, and you collect much higher-signal feedback before trying to scale down the human layer.
- Status: answered, leaning yes

### Q5

- Question: Is v1 a clinical product involving therapy/care delivery, or a psychologist-informed execution support product with humans in the loop?
- Recommendation: Make v1 a psychologist-informed execution support product, not a therapy product, unless you explicitly want to take on clinical workflow, licensing, safety escalation, and medical/compliance scope from day one.
- Status: answered

### Q6

- Question: Does the expert review every agent interaction, or only weekly summaries plus flagged exceptions?
- Recommendation: For v1, experts should review weekly summaries plus flagged exceptions, not every interaction, so the service stays operationally possible while still creating a strong feedback loop.
- Status: answered

### Q7

- Question: What exact artifact does the expert control and update for each user?
- Recommendation: The expert should maintain a lightweight user playbook that defines friction patterns, trigger moments, allowed interventions, disallowed interventions, and preferred rescue styles.
- Status: answered, reframed as extraction from normal sessions

### Q8

- Question: After each session, what exact structured fields do we extract into the user playbook?
- Recommendation: Start with a tiny schema:
  - current avoided work blocks
  - common friction patterns
  - likely stall signals
  - interventions that help
  - interventions that backfire
  - boundaries / do-not-do rules
  - when the human should step in
- Status: answered, rejected as too product-imposed

### Q9

- Question: Does the expert need to approve or edit the extracted session summary before it changes agent behavior?
- Recommendation: Yes. For v1, the extracted summary should be reviewed or approved by the expert before it becomes active guidance for the agent.
- Status: answered

### Q10

- Question: What single moment of failure should the agent own first in v1: block start, no-start rescue, or mid-block stall recovery?
- Recommendation: Start with block start plus no-start rescue. It is the cleanest wedge, easiest to detect, and closest to your core promise.
- Status: corrected as too narrow for the stated product promise

### Q11

- Question: What is the minimum end-to-end loop that must work in v1 for one user-week?
- Recommendation: A user has a session with the expert, the system extracts the
  session notes, the expert approves them, the agent supports the user when the
  plan meets resistance during the week, the expert monitors the agent, and that
  feedback feeds the Braintrust flywheel.
- Status: answered

### Q12

- Question: What is the main user-facing interaction model in v1: scheduled work
  blocks, freeform chat, or both with one clearly primary?
- Recommendation: Make scheduled work blocks primary and freeform chat
  secondary. That keeps the product anchored to the moment of action instead of
  drifting into generic conversation support.
- Status: answered, recommendation rejected

### Q13

- Question: If the product is fully conversational, how does the agent learn
  what the user intends to do and when to step in without making the user fill
  out forms?
- Recommendation: The agent should infer lightweight internal structure from
  freeform chat itself: what matters today, what the user plans to start next,
  rough timing, and the signals that indicate drift or derailment.
- Status: answered, recommendation rejected as wrong paradigm

### Q14

- Question: In the OpenClaw runtime, what should persist as the agent's durable
  operating context for each user: which parts belong in workspace files versus
  normal session memory?
- Recommendation: Use workspace files for durable user guidance and agent
  behavior, and use session memory for the natural day-to-day conversation flow.
- Status: deferred until after weekly loop and Braintrust flywheel are working

### Q15

- Question: What exact feedback should the expert leave during the week so it is
  useful both for helping the user and for the Braintrust flywheel?
- Recommendation: Keep it tiny and high-signal: what the agent did, whether it
  helped or hurt, and what should change next time.
- Status: deferred for later

### Q16

- Question: What is the first thing we should literally build to make the weekly
  loop real?
- Recommendation: Build the smallest expert session capture -> extraction ->
  approval -> agent update flow first, because that is the handoff that makes
  the rest of the loop possible.
- Status: asked

## Answers Log

### A1

- Capture mode: verbatim
- Note: preserve the user's exact language because wording is part of the
  product definition.
- Core line: "Intentive helps you start the work you avoid and recover faster
  when you derail."
- Core audience line: "For people with executive dysfunction, ADHD, or workdays
  that collapse at the moment of action."
- Positioning line: "Most tools help you plan. Intentive helps when the plan
  meets real life."
- Framing line: "Intentive is a proactive execution scaffold."

### A2

- Capture mode: verbatim
- Note: the user clarified that we are ideating how to go about building the
  v1, not only the product positioning.

#### V1 Build Note

this is true and there is another caviat we atre ideating how to go abuilding the v1

basic multi-user isolation plus a Braintrust loop around workspace/bootstrap files
1) OpenClaw already models the exact files you care about
OpenClaw’s context system explicitly injects these workspace files into the prompt:
AGENTS.md
SOUL.md
TOOLS.md
IDENTITY.md
USER.md
HEARTBEAT.md
BOOTSTRAP.md on first run only (OpenClaw)
That matters because your Braintrust loop is about those files. OpenClaw already treats them as first-class prompt inputs, and /context can show what got injected, whether a file was truncated, and how much context it consumed. (OpenClaw)
2) OpenClaw is more explicit about “multiple agents = multiple isolated brains”
OpenClaw says an agent has its own workspace, state directory, and session store under ~/.openclaw/agents/<agentId>/.... It also says multiple agents can share one Gateway server while keeping personalities, auth, and sessions isolated. (OpenClaw)
That is very close to what you need:
one server
many users
each user gets their own isolated “brain”
separate sessions and prompt files
But the “consumer app where each signed-in user gets their own isolated product brain.” For your product shape, OpenClaw’s per-agent isolation is the cleaner primitive. (OpenClaw)
3) OpenClaw gives you the cleaner place to intercept prompt assembly
OpenClaw’s system prompt is rebuilt each run and includes tool list, skills list, runtime metadata, and injected workspace files. It also supports pluggable context engines via plugins.slots.contextEngine, and delegates context assembly and compaction to the active engine. (OpenClaw)
That is exactly where a Braintrust loop can attach:
before prompt build
at prompt assembly
after model run
around compaction
around workspace-file injection
OpenClaw gives you explicit configuration-level seam for replacing or extending context behavior.
The blunt recommendation
For v1:
Use OpenClaw as the runtime
Do not use the OpenClaw gateway as your final public product backend
Put a thin Intentive backend in front of it
Map each signed-in user to one OpenClaw agent/workspace/session universe
Add Braintrust instrumentation in your backend and, where needed, in OpenClaw plugin/hooks
That is the simplest path that still scales conceptually.
What “user identity”, “tenant isolation”, and “session ownership” mean at lower level
You asked for the low-level view.
1) User identity
This is just the stable key for a human in your product.
At minimum:
user_id
email
created_at
status
This does not belong to OpenClaw. This belongs to your Intentive backend.
OpenClaw’s “sender” or channel peer is not enough for your app, because a product user is not the same thing as a Telegram sender or WhatsApp peer. OpenClaw routes messages into sessions based on origin like DMs, groups, cron jobs, and hooks. It also has DM isolation settings such as session.dmScope: "per-channel-peer". (OpenClaw)
That is useful runtime routing, but it is not full product identity.
So the rule is:
product user identity lives in Intentive backend runtime sender/session routing lives in OpenClaw
2) Tenant isolation
In your case, “tenant” can be as simple as “one user = one isolated brain.”
At minimum, tenant isolation means user A cannot leak into user B on:
prompt files
session history
memory
auth profiles
workspace files
tool side effects
OpenClaw already gives you a strong primitive for this via per-agent isolation: separate workspace, separate state dir, separate session store, separate auth profiles. (OpenClaw)
So for v1, implement tenant isolation like this:
tenant_id = user_id
each user gets one agentId
each agentId gets its own workspace directory
### A16

- Capture mode: near-verbatim
- Core clarification: expert feedback and intervention behavior are still an
  open discovery area in v1.

#### Exact Framing

Yeah, something like that but not sure what the nuances is because we want to
explore that area. That's pretty undetermined right now. We need to talk to the
expert and look into how they provide the feedback and kind of engineer a way
where we could get that into the brain trust opinionated loop, because it's not
just feedback, also like the expert can intervene in the conversation. So there
are a lot of experimentation and things that needs to go on there because the
product isn't at its final form yet. So that is the point why this is V1.

#### Working Interpretation

- the expert feedback format is not a locked spec yet
- expert intervention may happen directly in conversations, not only through
  offline comments
- Braintrust integration should be shaped around real expert behavior
- part of v1 is learning how expert monitoring, intervention, and feedback
  should actually work
each agentId gets its own session store
do not share auth profiles or transcript collections by default
That is enough.
3) Session ownership
This is the mapping:
which product user owns which runtime conversation/session
You need a table like:
app_session_id
user_id
agent_id
runtime_session_key
channel
created_at
last_seen_at
Why?
Because your app speaks in app sessions, but OpenClaw speaks in runtime sessions. OpenClaw routes messages to sessions based on source, and sessions can be shared or isolated depending on channel and config. (OpenClaw)
So your backend must own the translation layer.
That is what “session ownership” means.
The architecture I would actually build
Layer 1: Expo app
Owns:
sign-in
UI
push notifications
chat interface
Ignore OpenClaw here.
Layer 2: Intentive backend/API
Owns:
user identity
mapping user → agentId
mapping app session → OpenClaw session
user data tables
Braintrust traces
app events
prompt-file version selection
routing to the runtime
This is your real product boundary.
Layer 3: OpenClaw runtime
Owns:
agent loop
tools
workspace files
system prompt assembly
context compaction
sessions
plugins
This is the execution engine, not the product system of record.
How to do multi-user with OpenClaw, simply
You said no full billing/payments yet. Good. Keep it minimal.
Minimal v1 design
For each signed-in user:
create agentId = user_<uuid>
create workspace directory for that agent
seed:
AGENTS.md
SOUL.md
USER.md
TOOLS.md
HEARTBEAT.md
optionally BOOTSTRAP.md
route that user’s requests only to that agentId
let OpenClaw keep sessions under that agent’s session store
Why this works:
OpenClaw agents already have isolated workspace/state/session stores. (OpenClaw)
OpenClaw bootstrapping already seeds core files on first run. (OpenClaw)
OpenClaw already rebuilds the system prompt each run from those files. (OpenClaw)
So your backend does not need to reinvent the runtime. It only needs to create and route isolated instances cleanly.
What not to do
Do not start with one shared default agent and rely only on DM isolation.
Why?
Because OpenClaw explicitly says default shared DM session is fine for single-user setups, and warns that if multiple people can message your agent, you must enable DM isolation or users can share conversation context. (OpenClaw)
That tells you the default mental model is not “consumer multi-user app.” So use per-agent isolation, not just per-DM routing.
How to build the Braintrust loop around workspace files
This is the second half.
Your real target is not “trace everything.” Your target is:
turn prompt files into versioned, observable, testable levers
Braintrust gives you the core pieces for that:
traces/spans for logging requests and substeps
metadata on spans
datasets from real traces
evals made of data + task + scorers
deployable/versioned prompts with environments and pinned versions (Braintrust)
The key design choice
Do not treat AGENTS.md, SOUL.md, TOOLS.md, HEARTBEAT.md, USER.md as random files only.
Treat each as a versioned prompt component.
Your loop should be:
runtime builds prompt from workspace files
backend logs exactly which file versions were used
user outcome gets logged
good/bad traces become eval datasets
you test new file variants offline
ship new variants gradually
That is the real loop.

Braintrust traces capture inputs, outputs, timing, token usage, nested calls, errors, and custom metadata. (Braintrust)
OpenClaw exposes that the system prompt includes the injected workspace files, and /context can reveal truncation and sizes. (OpenClaw)
Braintrust explicitly models traces as nested spans, and @traced / start_span are the primitives to do this. (Braintrust)
What to attach specifically for the files
For each workspace file, store:
file logical name
content hash
human-readable version label
last edited time
char count / token estimate
whether injected
whether truncated
environment (dev, staging, prod)
Do not necessarily log the full raw file contents on every request if they are long or sensitive. Log the hash/version, and save snapshots separately when you are running experiments.
How to version those files with Braintrust
You have two viable patterns.
Pattern A: simplest and best for v1
Keep the files in your own storage/repo, but log their versions into Braintrust traces and evals.
That means:
you still edit AGENTS.md, SOUL.md, etc. as files
Braintrust tracks which version was used on each trace
offline evals compare version A vs B
This is simplest because OpenClaw already consumes files directly. (OpenClaw)
Pattern B: more advanced
Turn some of those files into Braintrust-deployed prompts or prompt fragments.
Braintrust supports prompt invocation by slug, prompt versioning, and environments like dev/staging/prod. Every save creates a new version, and you can pin versions or use environment-assigned versions. (Braintrust)
This is great later, but for v1 it adds indirection.
My recommendation
Start with Pattern A.
Because your runtime already expects physical workspace files. Do not fight that on day 1.
Concrete Braintrust loop for your files
Step 1: define the controlled prompt surfaces
Treat these as separate levers:
AGENTS.md = operating policy
SOUL.md = tone/persona/boundaries
TOOLS.md = tool use policy
HEARTBEAT.md = proactive cadence / check-in logic
USER.md = personalization facts
BOOTSTRAP.md = onboarding-only prompt
OpenClaw’s docs confirm these are injected into prompt context, with BOOTSTRAP.md first-run only. (OpenClaw)
Step 2: log production traces
For each real user turn:
create Braintrust trace
record file versions/hashes
record response
record tools used
record final user outcome if known
Step 3: define outcome labels
For Intentive, do not use only generic quality labels.
Use product scores like:
These can be human labels at first.
Step 4: build eval datasets from real traces
Braintrust traces can be used to build evaluation datasets. (Braintrust)
For each failure cluster, create a dataset row with:
input turn
relevant user state
active file versions
expected behavior notes
gold output or scoring notes
Step 5: run offline experiments
Braintrust evals are built from:
data
task
scores (Braintrust)
So your eval task is:
run the same OpenClaw prompt assembly or a replay harness
swap one file version or one section
score the result
Step 6: promote winning file variants
After an eval win:
update the file in repo/storage
mark it as new staging or prod
log new version in subsequent traces
The lower-level implementation plan I’d use
For multi-tenancy in OpenClaw
Use per-user agentId, not shared agent with just session routing.
Data model:
users
user_id
email
created_at
agents
agent_id
user_id
workspace_path
state_path
created_at
active_context_engine
sessions
app_session_id
user_id
agent_id
runtime_session_key
channel
created_at
last_seen_at
workspace_versions
workspace_version_id
agent_id
agents_md_hash
soul_md_hash
tools_md_hash
heartbeat_md_hash
user_md_hash
bootstrap_md_hash
created_at
environment
That is enough to start.
For Braintrust
One Braintrust project for:
intentive-prod-traces
One eval project for:
intentive-prompt-evals
Potentially one more later for:
intentive-skill-evals
Root trace metadata shape
Braintrust supports custom metadata on traces/spans, and that is exactly what it is for. (Braintrust)
Runtime choice
OpenClaw
Multi-user primitive
one signed-in user = one OpenClaw agentId
Braintrust strategy
instrument in Intentive backend first, not only inside runtime
Prompt management strategy
keep workspace files as files for v1, but version/hash them and log them into Braintrust on every turn
What not to do yet
do not fork OpenClaw core yet
do not move all prompt files into Braintrust prompt deployment yet
do not rely on one shared default agent
do not overbuild auth/billing right now
That gets you the simplest path with the least architectural regret.
The next most useful thing is a literal build spec:

### A3

- Capture mode: near-verbatim
- Note: this adds the human-in-the-loop structure for v1 and materially changes
  the product shape.

so in the image that you can see, we are going more and we are kind of ideating
more towards so many other aspects. So we are trying to build V1. So in the photo
that I mentioned, you kind of can see that there is a cycle lagist like a human
in the loop. So a professional that we are bringing in. So it's like a one on one
session where the user goes and talks to the therapist or the psyclologist and we
extract the 1:1 sessions, a professional helps identify your real friction
patterns, not just your goals.
They help define:
what usually blocks you
what kind of support works best
what the agent should and should not do

weekly 1:1 session
→ Session insights extracted by agent and user playbook
→ agent intervenes at block start / no-start / stall between sessions
→ psychologist monitors everyday, at the same time we enginer a way that the
reviews is engineered in the braintrust flywheel
→ feedback updates both user playbook and eval dataset

1. Intake + weekly 1:1 session
One psychologist or behavioral expert works with the user.

Do not make this a giant clinical intake.
Keep the extraction short and operational.

2. Between-session agent support

The agent should help only with one narrow problem first:

planned work block activation + no-start rescue

That means:

before or at block start, the agent checks in
if user does not begin, the agent intervenes
if user stalls, the agent rescues
at block end, the agent logs outcome

That is enough.

Do not make the agent do:

broad emotional companionship
life planning
therapy conversations for everything
habit tracking across all domains

3. intervention playbook

You do not want the agent improvising everything from scratch.

You want the sessions insights to define a light playbook per user, for example:

So the human owns strategy.
The agent owns execution.

4. Expert review dashboard, but tiny

Do not build a big clinician dashboard.

Build the smallest possible review layer where the psychologist monitor and be in
the loop

so as you can see, so as in the diagram that you can see the psychologist is
monitoring the agent behavior that's how it's helping the users and it's they are
kind of providing feedback to the agent right. So straight forward from
perspective of psychologist, they are helping them directly through the the
monetization but indirectly we also want to make the agent better. So we are
taking we are kind of engineering the way to extract those feedback and use that
into the braintrust flywheel as SME ( subject matter expert)

### A4

- Capture mode: diagram interpretation plus user clarification
- Note: the attached sketch materially clarifies the operating loop for v1.

#### Visual Loop

- user interacts with agent
- 1:1 sessions arc from user side toward the human expert side
- psychologist is explicitly labeled "Human in the loop" and "out source"
- psychologist monitors agent behavior
- feedback flows from psychologist back toward the agent/system
- an engineer collects that feedback
- Braintrust flywheel sits beneath the system as the built-in testing and
  improvement loop

#### Working Read

- the expert appears to be part of the default v1 service model, not an
  optional add-on
- the human expert directly helps the user and indirectly improves the agent
- expert feedback is both operational and evaluative
- the Braintrust loop is not separate analytics; it is part of the product
  learning system
- Q4 inferred answer: yes, v1 currently appears to require a human expert in the
  loop for each user or cohort

### A5

- Capture mode: verbatim
- Exact boundary: "not a clinical product but we use the knowledge and
  expertise from there, this where te line may blur, but we dont get into
  beuratics of health liceses and bla bla headache, so its not a healthcare
  platfom"
- Working interpretation:
  - not a therapy product
  - not a healthcare platform
  - informed by psychologist or behavioral expertise
  - avoid medical licensing and healthcare bureaucracy in v1
  - the line may blur, so product framing and operating boundaries will matter
    a lot

### A6

- Capture mode: near-verbatim
- Core clarification: the expert is not "reviewing" in the narrow QA sense;
  they are "monitoring" as an augmented operator whose reach is extended by the
  agent.

#### Exact Framing

So it's not reviewing but it's more like monitoring. You know what I'm saying.
We are using agent in the first place because humans have water length. They
have limited energy, right? So they don't have that power to help the users
throughout their day and all that. And that's the entire reason why therapy is
just one hour in the first place. If they could have done it, they would have
went through and help the users throughout the day and all that. So that's where
the agent is coming in place. So it's like it's augmenting the professionals
what could they have done if they have not so limited resources.

So it's more like I'm in the loop meaning the agent is helping my job, do my job
at its best. So we are not typically seeing therapy as one on one session or the
psychologist intervention as one on one. Why is it just one hour? So all these
are just limitations that were placed and the solutions that came out of it. If
you think from first principles how someone could go and help, there are no
limits like one hour session or something like that. So we are thinking from
first principles on how on we go about helping them, helping the users.

So that's where we are looking it from. So if I was like a psychologist and I
have a patient and I want to go and help him, I can't sit with him throughout
his life. I can't discuss with him. I can't always be on time and intervene when
it's completely necessary. Right? Because I have my own life and I also have my
humans. So I need to have lunch, I need to wash room, shower, sleep and all
that. On top of that I have my own life. On top of that, you are not just the
only patient, I am a multiple patient. So that's where the care gets limited.

So when we are helping them, so the agent is just augmenting what the therapist
would have done. So think of it like the psychologist is monitoring and staring
at the agent. It's like the psychologist is getting multiple, like more hands
and more cognitive bandwidth so that it won't help. So it's not divided, it's
more like an extension, the augmentation of the psychologist to provide more
value to the customers.

I know it didn't quite literally help you specify what we exactly want from
here. I mean that's where the grillby session is right. There are a lot of
nuances that come into place before we just dive into just me going and diving
into telling you okay this is okay I want the complete extraction of summary
here and quickly summarizing this and then plugging that in the dashboard right.
It's more we need to decode it so we need to think a lot so that's where I'm
talking to you and I'm in this grillby session.

#### Working Interpretation

- the expert is a strategic monitor, not a per-message reviewer
- the agent exists to extend scarce human cognitive bandwidth and timing
- the intended model is first-principles augmentation of expert support, not
  inheritance of legacy session constraints
- the product should feel like the expert has more reach, not like the expert
  is occasionally auditing software
- the product center is likely the interface between expert strategy and agent
  execution

### A7

- Capture mode: near-verbatim
- Core clarification: the expert may not author a playbook directly; they have
  normal sessions and the system extracts the operational parts.

#### Exact Framing

So the psychologist is having normal conversations, normal meaning like even
without this product, how are they helping the users currently, right? They are
talking about problems, they are talking about using all this psychotherapy and
all these techniques that they learn from the psychology and neuroscience or
therapy in general and they go and apply it to help if the user is struggling.

We are pinpointing at this exact point of what they are struggling with which is
ADHD and task paralysis, procrastination and all that but the core promise which
was in the landing page, right? So that's where the framing also matters, we
don't want to go and use the word procrastination and all that.

That's a different perspective meaning we are niching down into this small
market using the 021 idea of predatory. So we are in this niche market in that
broad procrastination, executive dysfunction and all that.

So in this niche our core promise is that intently helps you start to work you
avoid and recover after and recover faster when you do it. So they can get
whatever the things that they are doing done fast and be productive and all
that.

Going back to the point, so this is the exact specific thing in real world,
different people come with different problems and all that but this is like a
software world so we are targeting a single niche of users, we are not and we
are just helping that problem so there is a lot of layers here so keep with me,
right?

So let's say we attract only this sort of people with this sort of problem and
the psychologists go and talk to them and do their thing, what they do in their
sessions and we extract those conversations and the agent knows about the users
and what are the things that was in that conversation meaning let's say the user
was talking to the psychologist about not being able to wake up at time or be
completely overwhelmed by the pressure so they stopped even acting on anything
and they get in trouble because of that, something like that, right? So not to
get into these specifics but this is what usually talk about and the therapist
would go about using their expertise and practices and help them through it

so, we are just extracting that like whatever the conversation is happening we
are extracting that.

#### Section 1: the problem

Real life does not fall apart during the session.
It falls apart between them.
You may already know what matters.
The hard part is what happens next:
you freeze at the start
you avoid the task even though you care
one interruption breaks momentum
guilt builds and the whole day slips
Traditional therapy or coaching can create insight.
But the hardest moments usually happen later, in the middle of ordinary life.
Generic productivity tools do not solve that.
They store intentions. They do not step in when friction hits.

#### Section 2: the core promise

Intentive is built for the moment the plan meets resistance.
It helps you:
start important work when you are stuck
recover when momentum breaks
handle friction between sessions
turn expert guidance into daily action
This is not another planner.
It is support at the point where follow-through usually fails.

#### Working Interpretation

- the expert-owned artifact may be generated through extraction rather than
  direct authoring
- the system likely needs a structured session-to-playbook extraction layer
- the product promise is still about avoided work and faster recovery, not
  generic procrastination language
- the operational gap being solved is "between sessions"
- the agent should turn expert guidance into daily action

### A8

- Capture mode: verbatim
- Exact correction: "no just extracting insights and summery, we dont control
  these distinctions, thats the experts jobs so keep the customers on the scope
  of getting better, while extracting weare just extracting like the notes what
  happened in that session"
- Working interpretation:
  - the system should extract session insights and summaries, not over-formalize
    the expert's judgment into rigid product-owned categories
  - the expert remains the owner of distinctions and interpretation
  - the product should stay focused on helping the customer get better
  - the extraction layer is closer to session notes than a hard-coded clinical
    or behavioral taxonomy

### A9

- Capture mode: verbatim
- Exact answer: "yeah sure till we add the testing flywheel and make this reliable"
- Working interpretation:
  - for v1, extracted summaries should be expert-approved before affecting
    agent behavior
  - expert approval is a temporary reliability scaffold, not necessarily the
    permanent design
  - the Braintrust/testing flywheel is intended to reduce this dependence over
    time by making the system trustworthy

### A10

- Capture mode: near-verbatim
- Core correction: the product promise is broader than a single rigid failure
  moment, and the user expectation is already set by the framing.

#### Exact Framing

i already gave you this remember?

this is the core promise so this is what it should
Intentive helps you start the work you avoid and recover faster when you derail.
For people with executive dysfunction, ADHD, or workdays that collapse at the
moment of action.
Subheadline
Most tools help you plan.
Intentive helps when the plan meets real life.
It checks in at the right moment, helps you take the first step, and rescues
you before one bad hour becomes a lost day.

You probably do not need another planner.
You already know what matters.
The hard part is what happens next:
you delay starting
a small interruption breaks momentum
one avoided task turns into a lost block
guilt builds and the whole day slips
Intentive is built for that moment.

Start the work you avoid. Recover faster when you derail.

this what the we filter the users, so they already have expectation set, then
the experts are not robots with states and the LLMs base agents are intelligent
too, also we are not hardcoding code here

it might not be straint forward as block start plus no-start rescue

What success looks like

Not “users liked it.”

Success looks like this: we over deliver on our promise +
psychologist can meaningfully improve the agent week over week
expert feedback is structured enough to reuse in evals
the product feels like support, not extra homework

#### Working Interpretation

- the landing-page promise already defines the expectation envelope for the
  product
- the system should not be over-specified as if the expert and agent are rigid
  state machines
- v1 still needs focus, but that focus should be an end-to-end support loop, not
  an artificially tiny trigger definition
- success is not user sentiment alone
- success includes:
  - over-delivering on the promise
  - expert-driven week-over-week improvement of the agent
  - feedback structured enough for eval reuse
  - a user experience that feels like support, not homework

### A11

- Capture mode: verbatim
- Exact answer: "yeah agree"
- Locked weekly v1 loop:
  - one weekly expert session
  - extracted session summary
  - expert approves it
  - agent supports the user when the plan meets resistance during the week
  - expert monitors the agent
  - feedback is captured into the Braintrust flywheel

### A12

- Capture mode: near-verbatim
- Exact correction:

what the fuck is scheduled work blocks are primary? how do you think that
happens? Remember that we talked about this is not a fucking traditional
software engineering app. There won't be any forms or there won't be any to-do
list or like any of the existing productivity tools. Where they can go and add
their blocks and set the block and add timer and all that shit. And remember
when I said about extension of the expert that means it should fucking feel
human. So when you're talking to this agent, so it's like the agent is alive. So
it should feel natural.
so it should capture in the freeform chat it self

- Working interpretation:
  - v1 should not feel like a traditional productivity app
  - no explicit forms, blocks, timers, or to-do-list mechanics in the primary
    user experience
  - the interaction should feel human and natural
  - the agent should capture relevant intent from freeform chat itself
  - any structure needed for intervention should be internal, not exposed as
    user homework

### A13

- Capture mode: verbatim
- Exact correction: "not dont agree, and we are not in the same paradigm at
  all, didnt you here when i said its use are use openclaw runtime as our
  agent?"
- Working interpretation:
  - this is not a stateless chat UX question first
  - the core product primitive is the OpenClaw runtime
  - the agent has durable workspace files, memory, heartbeat behavior, and
    proactive runtime capabilities
  - the right design question is how Intentive maps its human-in-the-loop model
    onto OpenClaw's runtime primitives

### A14

- Capture mode: near-verbatim
- Exact direction: "dont worry about that thats al comes after we set up the
  braintrst and the weekly loop and start he agent behavior gets formed"
- Working interpretation:
  - do not lock runtime file boundaries yet
  - first make the weekly loop real
  - first instrument the Braintrust flywheel
  - let agent behavior emerge from real operation before formalizing deeper
    runtime structure

### A15

- Capture mode: verbatim
- Exact direction: "again not to worry about this here"
- Working interpretation:
  - defer expert-feedback schema details for now
  - stay at the level of build order and loop design
  - avoid premature formalization of the flywheel inputs

## Recommendations

- Start by naming the user and the pain before naming features.
- Keep the product anchored on intervention at the point of failure.
- Preserve exact product language when it carries positioning weight.
- Separate "what v1 proves" from "what v1 needs underneath."
- Keep the v1 agent narrow: planned work block activation and no-start rescue.
- Treat the human expert as the strategy layer, not as generic oversight.
- Decide early whether this is care delivery or psychologist-informed support.
- Design the system as expert augmentation, not expert replacement and not agent
  autonomy theater.
- Keep the expert role advisory and operational, not clinical.
- Design a tiny extraction schema before designing a big dashboard.
- Let the expert own interpretation; let the system own note capture and
  operationalization.
- Use expert approval as a temporary trust bridge until the flywheel earns the
  right to automate more.
- Define the minimum end-to-end weekly loop, not just isolated trigger logic.
- Keep structure under the hood and conversation on the surface.
- Design from the OpenClaw runtime outward, not from generic chat-app patterns
  inward.
- Sequence decisions so product learning comes before deeper runtime
  formalization.
- Keep deferring low-level schemas until the weekly loop itself is concrete.
- Narrow the first launch persona before deciding workflows or channels.

## Open Questions

- Who is the first target user at launch?
- What is v1 actually trying to prove first?
- Is this a clinical product or a psychologist-informed support product?
- Does the expert approve the extracted notes before they affect the agent?
- What is the minimum end-to-end loop that must work in one user-week?
- What is the main user-facing interaction model in v1?
- What is the first thing we should build to make the weekly loop real?
- What does the rescue loop look like in practice inside that weekly loop?
