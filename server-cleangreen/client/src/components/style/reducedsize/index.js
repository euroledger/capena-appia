import {
    withStyles,
} from '@material-ui/core/styles';

const GlobalCss = withStyles({
    '@global': {
        '.MuiOutlinedInput-root': {
            borderRadius: 0,
            color: 'black',
            fontWidth: 900
        },
        '.MuiFilledInput-input': {
            padding: '18px 12px 10px'
        },
        '.MuiFilledInput-root': {
            position: 'relative',
            transition: 'background-color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms',
            backgroundColor: '#F4F4F4',
            border: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            border: "1px solid #CDCDCD"
        },
        '.MuiFilledInput-underline:before': {
            left: 0,
            right: 0,
            bottom: 0,
            content: "00a0",
            position: 'absolute',
            transition: 'border-bottom-color 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
            borderBottom: 0,
            pointerEvents: 'none'
        },
        '.MuiInputLabel-filled.MuiInputLabel-shrink': {
            transform: 'translate(12px, 10px) scale(0.75)',
            color: '#AAA9A9',
            fontFamily: 'Open Sans, Arial, sans-serif',
            fontSize: '20px',
            fontWeight: '500'
        },
        '.MuiFormLabel-root': {
            color: 'black',
            padding: 0,
            fontSize: '1.125rem',
            fontFamily: 'Open Sans, Arial, sans-serif',
            fontWeight: '400'
        },
        '.MuiInputBase-root.Mui-disabled': {
            color: 'black',
            cursor: 'default'
        }
    }


})(() => null);

export default GlobalCss;
