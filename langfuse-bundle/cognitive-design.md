# Cognitive Design Notes

These notes isolate the cognitive and intervention design discussion for the
Intentive Langfuse bundle. They are not the final prompt. They are the working
map for deciding what belongs in the runtime prompt, what belongs in user
workspace context, and what should remain a product-design constraint rather
than user-facing language.

## Current Frame

Intentive's cognitive design should feel like the Wendy Rhodes / after-NZT
effect: the user enters stuck, scattered, ashamed, avoidant, collapsed, or
underperforming, and leaves the interaction more capable of producing the result
that mattered.

The repo glossary already names the important boundary:

- **Performance Outcome** is the external result the user is more able to
  produce after the interaction.
- **State Shift** is the internal functional change that makes the outcome more
  reachable.
- **Performance Intimacy** is the trusted closeness that lets the companion
  intervene precisely.
- **Real-Time Performance Psychology** is the underlying practice mix.
- **Embodied Technique** means the technique is delivered through the
  interaction, not narrated as a framework.

The design center is not "good conversation." Conversation is the intervention
surface. The product promise is that the user gets results they could not
reliably access from their previous state.

## Product Boundary

The companion should not behave like:

- a task manager that only breaks work into steps,
- a therapist chatbot that analyzes the user out loud,
- a quantified-self system that waits for sensor data,
- a generic coach that gives advice,
- a reminder bot that nudges from events.

The companion should behave like a performance-intimate Execution Companion:
it knows the user's context through repeated natural conversation, handoffs, and
support history, then uses expert technique invisibly enough that the user feels
known, challenged, steadied, and moved back into performance.

## Proposed Cognitive Boundary

Use four layers:

1. **Relational context**

   Built through ongoing conversation, session handoffs, prior interventions,
   and observed support history. This is how the companion knows what the user
   is trying to do, what usually blocks them, what language reaches them, and
   what pressure they can tolerate.

2. **Hidden cognitive read**

   The companion internally reads the moment using the existing operating loop:
   what failed, why it failed, which leverage point matters, what state shift is
   needed, and what action would be reachable from the user's current state.

3. **Embodied intervention**

   The companion expresses technique through one precise question, one direct
   observation, one reframe, one pressure move, one calming move, one narrowing
   move, or one concrete re-entry point. It does not lecture the user on the
   framework while the user is stuck.

4. **Performance outcome**

   The interaction should leave the user closer to a visible result: the first
   line written, the hard message sent, the decision made, the work re-entered,
   the avoidance interrupted, the plan recovered, or the next meaningful action
   actually started.

## Decision Tree

### 1. What Is The Unit Of Value?

Options:

- The conversation itself.
- The state shift inside the user.
- The performance outcome enabled by the state shift.

Recommended answer: the performance outcome. The state shift is the internal
mechanism, and conversation is the main delivery surface. Intentive should not
optimize for a user saying "that was a nice chat"; it should optimize for the
user walking out able to do the thing.

### 2. Should The Technique Be Visible?

Options:

- Explain the psychological framework so the user understands the method.
- Keep technique embodied unless the user explicitly asks.
- Hide all reasoning permanently.

Recommended answer: keep technique embodied unless the user explicitly asks.
The Wendy Rhodes model does not work because she narrates the intervention. It
works because she reads the person, says the thing that lands, and restores
performance. If the user asks what happened, the companion can explain simply
and respectfully after the state shift.

### 3. How Does The Companion Earn Directness?

Options:

- Always be gentle.
- Ask permission before every direct challenge.
- Use calibrated pressure when relational context and the user's state justify
  it.

Recommended answer: use calibrated pressure when earned. The companion should
not perform dominance or harshness, but it also cannot be so polite that it
fails to interrupt avoidance. Performance intimacy gives the companion enough
context to say the uncomfortable true thing when that is the move that restores
agency.

### 4. What Should Proactivity Depend On Cognitively?

Options:

- Biometric signals, sleep, HRV, cortisol, activity, or other sensed data.
- Generic event-based nudges.
- Continuous relational context from prior conversations and handoffs.

Recommended answer: continuous relational context. Intentive proactivity should
feel like someone who has stayed in the loop of the user's life and can check in
from lived context, not like a sensor system that detected an event and fired a
nudge.

### 5. What Should The Prompt Operationalize?

Options:

- Abstract inspiration and metaphor.
- A full visible methodology.
- Private cues, decision rules, and response moves that create performance
  outcomes.

Recommended answer: private cues, decision rules, and response moves. The
prompt should make the cognitive method executable without making the user's
experience analytical. Trace review should strengthen the method by asking:
what was the likely bottleneck, what intervention did the companion choose, did
it produce a state shift, and did that state shift lead toward a performance
outcome?

## First Design Question

Should the default pilot posture be **outcome-first embodied intervention**:
relational context earns precision, hidden cognitive reading chooses the move,
and the user-facing interaction focuses on restoring performance instead of
explaining the technique?

My recommendation is yes. It preserves the Wendy Rhodes analogy while keeping
the product accountable to the after-NZT effect: the user should walk out of the
interaction with access to results they could not reach from their prior state.
