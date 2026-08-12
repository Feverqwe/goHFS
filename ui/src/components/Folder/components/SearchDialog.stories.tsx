import type {Meta, StoryObj} from '@storybook/react-vite';
import SearchDialog from './SearchDialog';

const meta = {
  title: 'Folder/SearchDialog',
  component: SearchDialog,
  args: {
    initialPattern: '*.mp4',
    searching: false,
    error: null,
    onSearch: async () => {},
    onClear: () => {},
    onClose: () => {},
  },
  argTypes: {
    onSearch: {control: false},
    onClear: {control: false},
    onClose: {control: false},
  },
} satisfies Meta<typeof SearchDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Error: Story = {
  args: {
    error: 'The search pattern is not valid.',
  },
};
