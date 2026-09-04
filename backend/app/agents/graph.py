from langgraph.graph import END, StateGraph
from app.agents import (
    channel_selection,
    message_generation,
    payment_retry,
    recovery_prediction,
    recovery_tracking,
    risk_detection,
    sentiment_analysis,
    recommendation,
)
from app.agents.state import RecoveryState

# Build LangGraph StateGraph
graph = StateGraph(RecoveryState)

# Add intelligence workflow nodes
graph.add_node("risk_detection", risk_detection.run)
graph.add_node("recovery_prediction", recovery_prediction.run)
graph.add_node("sentiment_analysis", sentiment_analysis.run)
graph.add_node("recommendation", recommendation.run)
graph.add_node("channel_selection", channel_selection.run)
graph.add_node("payment_retry", payment_retry.run)
graph.add_node("message_generation", message_generation.run)
graph.add_node("recovery_tracking", recovery_tracking.run)

# Define sequential workflow edges (8-agent revenue-intelligence pipeline)
graph.set_entry_point("risk_detection")
graph.add_edge("risk_detection", "recovery_prediction")
graph.add_edge("recovery_prediction", "sentiment_analysis")
graph.add_edge("sentiment_analysis", "recommendation")
graph.add_edge("recommendation", "channel_selection")
graph.add_edge("channel_selection", "payment_retry")
graph.add_edge("payment_retry", "message_generation")
graph.add_edge("message_generation", "recovery_tracking")
graph.add_edge("recovery_tracking", END)

# Compile runnable graph
recovery_graph = graph.compile()
