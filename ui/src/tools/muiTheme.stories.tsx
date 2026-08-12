import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import MovieRoundedIcon from '@mui/icons-material/MovieRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import UploadRoundedIcon from '@mui/icons-material/UploadRounded';
import type {Meta, StoryObj} from '@storybook/react-vite';
import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

const fileItems = [
  {name: 'Archive', details: '12 folders', icon: <FolderRoundedIcon />, kind: 'Folder'},
  {
    name: 'Launch reel.mp4',
    details: '1.4 GB · 12 Aug 2026',
    icon: <MovieRoundedIcon />,
    kind: 'Video',
  },
  {
    name: 'Cover artwork.png',
    details: '8.2 MB · 11 Aug 2026',
    icon: <ImageRoundedIcon />,
    kind: 'Image',
  },
];

const ThemePreview = () => (
  <Box sx={{minHeight: '100vh', p: {xs: 2, sm: 4}}}>
    <Box sx={{mx: 'auto', maxWidth: 960}}>
      <Stack spacing={0.75} sx={{mb: 3}}>
        <Typography variant="overline" color="primary.light">
          GoHFS / visual system
        </Typography>
        <Typography variant="h4">Graphite archive</Typography>
        <Typography color="text.secondary" sx={{maxWidth: 620}}>
          A quiet, high-contrast workspace for browsing and sharing files across devices.
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {xs: '1fr', md: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)'},
          gap: 2,
        }}
      >
        <Stack spacing={1.25}>
          {fileItems.map(({name, details, icon, kind}) => (
            <Card key={name}>
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 1.5,
                  '&:last-child': {pb: 1.5},
                }}
              >
                <IconButton aria-label={`Open ${name}`} size="small">
                  {icon}
                </IconButton>
                <Box sx={{minWidth: 0, flexGrow: 1}}>
                  <Typography sx={{fontWeight: 700}}>{name}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap component="div">
                    {details}
                  </Typography>
                </Box>
                <Chip label={kind} variant="outlined" size="small" />
              </CardContent>
            </Card>
          ))}

          <Alert severity="error" icon={<ErrorOutlineRoundedIcon />}>
            Preview could not be generated. The original file is still available.
          </Alert>
          <Alert severity="info" variant="outlined">
            Outlined alerts keep their variant styling.
          </Alert>
        </Stack>

        <Card>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Find a file
            </Typography>
            <Typography variant="h5" sx={{mt: 0.5, mb: 2}}>
              Search this folder
            </Typography>
            <Stack spacing={2}>
              <TextField label="Name or pattern" defaultValue="*.mp4" size="small" />
              <Alert severity="success" icon={<CheckCircleOutlineRoundedIcon />}>
                Folder index is up to date.
              </Alert>
              <Stack direction={{xs: 'column', sm: 'row'}} spacing={1}>
                <Button variant="contained" startIcon={<SearchRoundedIcon />}>
                  Search
                </Button>
                <Button variant="outlined" startIcon={<UploadRoundedIcon />}>
                  Upload files
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Stack direction="row" useFlexGap spacing={1} sx={{mt: 3, flexWrap: 'wrap'}}>
        <Chip label="Available" color="success" variant="outlined" />
        <Chip label="Indexing" color="info" variant="outlined" />
        <Chip label="Read only" color="warning" variant="outlined" />
        <Chip label="Unavailable" color="error" variant="outlined" />
        <IconButton aria-label="Retry warning" color="warning" size="small">
          <ErrorOutlineRoundedIcon />
        </IconButton>
        <CircularProgress aria-label="Warning progress" color="warning" size={24} />
      </Stack>
    </Box>
  </Box>
);

const meta = {
  title: 'Theme/Graphite Archive',
  component: ThemePreview,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ThemePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FileBrowser: Story = {};
