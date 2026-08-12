import type {Meta, StoryObj} from '@storybook/react-vite';
import ActionButton from './ActionButton';

const meta = {
  title: 'Folder/ActionButton',
  component: ActionButton,
  args: {
    children: 'Update',
    onSubmit: async () => {},
    variant: 'contained',
  },
  argTypes: {
    onSubmit: {control: false},
  },
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const LoadingAfterClick: Story = {
  args: {
    children: 'Calculate size',
    onSubmit: () => new Promise(() => undefined),
  },
};

export const ErrorAfterClick: Story = {
  args: {
    children: 'Update',
    onSubmit: async () => {
      throw new Error('Failed to update');
    },
  },
};
