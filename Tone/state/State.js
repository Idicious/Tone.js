define(["Tone/core/Tone"], function(Tone) {
  /**
   * @type {Map<uuid, state>}
   */
  Tone.state = new Map();

  /**
   * @type {Map<uuid, Tone>}
   */
  Tone.nodes = new Map();

  Tone.onStateChange = null;

  Tone.Actions = {
    ADD: "ADD",
    UPDATE: "UPDATE",
    DELETE: "DELETE"
  };

  Tone.getState = function() {
    return Array.from(Tone.state.values()).map(function(nodeState) {
      var state = {
        uuid: nodeState.uuid,
        nodeType: nodeState.nodeType,
        toMaster: nodeState.toMaster
      };

      if (nodeState.inputs != null) {
        state.inputs = nodeState.inputs.slice();
      } // return copy so state is immutable
      if (nodeState.outputs != null) {
        state.outputs = nodeState.outputs.slice();
      } // return copy so state is immutable
      if (nodeState.params != null) {
        state.params = Object.assign({}, nodeState.params);
      } // return copy so state is immutable

      return state;
    });
  };

  /**
   *
   * @param {[]} state
   */
  Tone.setState = function(state) {
    state.forEach(function(nodeState) {
      var node = new Tone[nodeState.nodeType]();
      if (nodeState.params != null) {
        node.set(nodeState.params);
      }

      Tone.state.set(nodeState.uuid, nodeState);
      Tone.nodes.set(nodeState.uuid, node);
    });

    state.forEach(function(nodeState) {
      if (nodeState.inputs != null) {
        var node = Tone.nodes.get(nodeState.uuid);

        nodeState.inputs.forEach(function(input) {
          Tone.nodes[input].connect(node);
        });
      }
    });
  };

  Tone.dispatch = function(action) {
    switch (action.type) {
      case Tone.Actions.ADD:
        Tone.add(action.payload);
        break;
      case Tone.Actions.UPDATE:
        Tone.update(action.payload);
        break;
      case Tone.Actions.DELETE:
        Tone.delete(action.payload);
        break;
      default:
        throw new Error(
          "Tone.dispatch: Invalid action type: " +
            action.type +
            " - " +
            action.payload
        );
    }

    if (
      Tone.onStateChange != null &&
      typeof Tone.onStateChange === "function"
    ) {
      Tone.onStateChange(Tone.getState());
    }
  };

  Tone.add = function(payload) {
    if (payload.nodeType == null || payload.uuid == null) {
      throw new Error(
        "Tone.add: payload must have a node type and id: " + payload
      );
    }

    if (typeof Tone[payload.nodeType] !== "function") {
      throw new Error(
        "Tone.add: payload.nodeType must be a Tone.js type: " + payload
      );
    }

    var node = new Tone[payload.nodeType]();

    Tone.state.set(payload.uuid, payload);
    Tone.nodes.set(payload.uuid, node);

    if (payload.params != null) {
      node.set(payload.params);
    }

    if (payload.inputs != null) {
      payload.inputs.forEach(function(input) {
        Tone.nodes.get(input).connect(node);
      });
    }

    if (payload.outputs != null) {
      payload.outputs.forEach(function(output) {
        node.connect(Tone.nodes.get(output));
      });
    }

    if (payload.toMaster) {
      node.toMaster();
    }
  };

  Tone.update = function(payload) {
    var tone = Tone.state[payload.uuid];

    if (payload.toMaster && !tone.toMaster) {
      tone.node.toMaster();
    }

    tone.node.set(payload.params);
  };

  Tone.delete = function(payload) {
    var node = Tone.nodes.get(payload.uuid);
    node.dispose();

    Tone.state.delete(payload.uuid);
    Tone.nodes.delete(payload.uuid);
  };
});
