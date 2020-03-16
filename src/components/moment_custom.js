import React  from 'react';
import Moment  from 'react-moment'
import moment from 'moment';
 
export default class ReactMoment extends React.Component {
    render() {
        const { ...props} = this.props;        
        if(!moment(props.children).isValid() ){
            return "";
        }
        return (
            <Moment {...props}>{moment(props.children)}</Moment>
        );
    }
}