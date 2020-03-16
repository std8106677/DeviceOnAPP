import _ from "lodash";
import { SET_PAGEBACKEND} from "../actions";

export default function(state = "", action) {
  switch (action.type) {
    case SET_PAGEBACKEND:
      return action.payload;
    default:
      return state;
  }
}
