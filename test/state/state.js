define(["Tone/core/Tone", "Tone/state/State", "helper/Supports"], 
function(Tone, Supports) {
  describe("State", function() {
    it("can add an audio node", function() {
      Tone.dispatch({
        type: Tone.Actions.ADD,
        payload: {
          uuid: "1",
          nodeType: "Meter",
          toMaster: true,
          params: {
            smoothing: 0.8
          }
        }
      });

      var state = Tone.getState();

      expect(JSON.stringify(state)).to.equal(JSON.stringify([
        {
          uuid: "1",
          nodeType: "Meter",
          toMaster: true,
          params: {
            smoothing: 0.8
          }
        }
      ]));
    });

    if (Supports.ONLINE_TESTING){
        it("can read audio data", function(done) {
            Tone.dispatch({
                type: Tone.Actions.ADD,
                payload: {
                    uuid: "2",
                    nodeType: "Signal",
                    params: {
                        value: 1
                    }
                }
            });

            Tone.dispatch({
                type: Tone.Actions.ADD,
                payload: {
                    uuid: "1",
                    nodeType: "Meter",
                    toMaster: true,
                    inputs: ['2'],
                    params: {
                        smoothing: 0.8
                    }
                }
            });

            var meter = Tone.nodes.get('1');
            var signal = Tone.nodes.get('2');
            setTimeout(function(){
                expect(meter.getValue()).to.be.closeTo(1, 0.05);
                Tone.dispatch({
                    type: Tone.Actions.DELETE,
                    payload: {
                        uuid: "1",
                    }
                });
                Tone.dispatch({
                    type: Tone.Actions.DELETE,
                    payload: {
                        uuid: "2",
                    }
                });
                done();
            }, 400);
        });
    }
  });
});
