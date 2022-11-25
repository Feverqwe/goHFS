import {Dialog, styled} from '@mui/material';

const MyDialog = styled(Dialog)(({theme}) => {
  return {
    '.MuiPaper-root': {
      backgroundImage: 'none',
    },
  };
});

export default MyDialog;
