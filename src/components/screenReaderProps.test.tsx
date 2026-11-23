// Checks that every UI-library component supports the shared screen-reader props:
// custom spoken text (label, hint, press announcement), hideFromScreenReader and screenReaderOrder.
import type { ReactElement } from 'react';
import { AccessibilityInfo, Platform, Text } from 'react-native';
import { fireEvent, isHiddenFromAccessibility, render, screen } from '@testing-library/react-native';
import {
  AccessibilityOrder,
  ScreenReaderOrderScope,
  useScreenReaderOrder,
  type ScreenReaderControlProps,
  type ScreenReaderProps,
  type ScreenReaderStopProps,
} from '@/components/accessibility';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthErrorMessage } from '@/components/auth/AuthErrorMessage';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthLinkButton } from '@/components/auth/AuthLinkButton';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { OrDivider } from '@/components/auth/OrDivider';
import { PasswordField } from '@/components/auth/PasswordField';
import SlidingPages from '@/components/auth/SlidingPages';
import VerifyEmailContent from '@/components/auth/VerifyEmailContent';
import { SAMPLE_EVENT } from '@/components/events/__fixtures__/sampleEvent';
import { EventDateTime } from '@/components/events/EventDateTime';
import { EventDetails } from '@/components/events/EventDetails';
import { EventHeader } from '@/components/events/EventHeader';
import { EventLocation } from '@/components/events/EventLocation';
import { EventNote } from '@/components/events/EventNote';
import { RsvpSection } from '@/components/events/RsvpSection';
import { TeamRelationship } from '@/components/events/TeamRelationship';
import InviteActions from '@/components/invite/InviteActions';
import InviteMessage from '@/components/invite/InviteMessage';
import TeamBadge from '@/components/invite/TeamBadge';
import AppButton from '@/components/team/AppButton';
import TeamHeader from '@/components/team/TeamHeader';
import TeamIcon from '@/components/team/TeamIcon';
import TeamInfoCard from '@/components/team/TeamInfoCard';
import TeamListRow from '@/components/team/TeamListRow';
import { RequestSentMessage } from '@/components/teams/RequestSentMessage';
import { SuccessBadge } from '@/components/teams/SuccessBadge';
import { TabBarButton } from '@/components/teams/TabBarButton';
import { TabBarIcon } from '@/components/teams/TabBarIcon';
import { TabBarLabel } from '@/components/teams/TabBarLabel';
import { AppText } from '@/components/ui/AppText';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Avatar } from '@/components/ui/Avatar';
import { Calendar } from '@/components/ui/Calendar';
import { CenteredMessage } from '@/components/ui/CenteredMessage';
import { Chip } from '@/components/ui/Chip';
import { ChoiceButton } from '@/components/ui/ChoiceButton';
import { CountBadge } from '@/components/ui/CountBadge';
import { DateTile } from '@/components/ui/DateTile';
import { FilterChip } from '@/components/ui/FilterChip';
import { IconButton } from '@/components/ui/IconButton';
import { ListGroup } from '@/components/ui/ListGroup';
import { ListRow } from '@/components/ui/ListRow';
import { MessageComposer } from '@/components/ui/MessageComposer';
import { PhotoButton } from '@/components/ui/PhotoButton';
import { PickerField } from '@/components/ui/PickerField';
import { RadioCard } from '@/components/ui/RadioCard';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchField } from '@/components/ui/SearchField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SelectField } from '@/components/ui/SelectField';
import { StepProgress } from '@/components/ui/StepProgress';
import { TabStrip } from '@/components/ui/TabStrip';
import { Tag } from '@/components/ui/Tag';
import { ToggleCard } from '@/components/ui/ToggleCard';
import { ChannelCard } from '@/components/chat/ChannelCard';
import { ChannelIdentity } from '@/components/chat/ChannelIdentity';
import { ChannelMessage } from '@/components/chat/ChannelMessage';
import { ChatListHeader } from '@/components/chat/ChatListHeader';
import { ConversationHeader } from '@/components/chat/ConversationHeader';
import { ConversationRow } from '@/components/chat/ConversationRow';
import { DateDivider } from '@/components/chat/DateDivider';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TeamSwitcherMenu } from '@/components/chat/TeamSwitcherMenu';
import { EventCard } from '@/components/events/EventCard';
import { RsvpReplies } from '@/components/events/RsvpReplies';
import { HomeHeader } from '@/components/home/HomeHeader';
import { AnnouncementHeader } from '@/components/notifications/AnnouncementHeader';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { TeamCard } from '@/components/team/TeamCard';
import CloseIcon from '@/assets/icons/close.svg';
import type { TeamWithId } from '@/types';

jest.mock('@react-native-vector-icons/ionicons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));
jest.mock('expo-router', () => ({ usePathname: () => '/tabs/teams/find', router: { push: jest.fn() } }));
jest.mock('@/services/teamService', () => ({
  regions: [{ regionId: 1, city: 'Washington', state: 'DC', country: 'United States of America', lat: 0, lon: 0 }],
}));

const noop = () => {};
const TEAM: TeamWithId = {
  id: 'team_1',
  name: 'Baltimore Blades',
  region: '1',
  supervisorId: 'coach_1',
  status: 'active',
  wins: 0,
  losses: 0,
};

type Case = {
  name: string;
  /** Renders the component with only the shared props. */
  render: (shared: ScreenReaderProps) => ReactElement;
  /** The component with custom spoken text, and the labels, hints and announcements it must produce. */
  custom?: {
    element: ReactElement;
    labels: string[];
    hints?: string[];
    presses?: { label: string; announcement: string }[];
  };
  /** Decorative components are hidden unless hideFromScreenReader={false}. */
  decorative?: boolean;
};

// One interactive stop: screenReaderLabel, screenReaderHint and screenReaderPressAnnouncement.
const controlCase = (name: string, make: (props: ScreenReaderControlProps) => ReactElement): Case => ({
  name,
  render: make,
  custom: {
    element: make({
      screenReaderLabel: `${name} label`,
      screenReaderHint: `${name} hint`,
      screenReaderPressAnnouncement: `${name} announced`,
    }),
    labels: [`${name} label`],
    hints: [`${name} hint`],
    presses: [{ label: `${name} label`, announcement: `${name} announced` }],
  },
});

// One non-interactive stop: screenReaderLabel.
const stopCase = (name: string, make: (props: ScreenReaderStopProps) => ReactElement, decorative = false): Case => {
  const shown = decorative ? { hideFromScreenReader: false } : {};
  return {
    name,
    decorative,
    render: (shared) => make({ ...shown, ...shared }),
    custom: { element: make({ ...shown, screenReaderLabel: `${name} label` }), labels: [`${name} label`] },
  };
};

const cases: Case[] = [
  // Single stops
  stopCase('AppText', (p) => <AppText {...p}>Components</AppText>),
  stopCase('TabBarLabel', (p) => <TabBarLabel title="Teams" focused {...p} />),
  stopCase('TabBarIcon', (p) => <TabBarIcon name="teams" focused {...p} />, true),
  stopCase('TeamIcon', (p) => <TeamIcon name="Baltimore Blades" {...p} />, true),
  stopCase('SuccessBadge', (p) => <SuccessBadge {...p} />, true),
  stopCase('TeamRelationship (joined)', (p) => <TeamRelationship state="joined" teamName="Baltimore Blades" {...p} />),
  stopCase('EventDateTime', (p) => <EventDateTime start={SAMPLE_EVENT.startTime} end={SAMPLE_EVENT.endTime} {...p} />),
  stopCase('EventLocation', (p) => <EventLocation location={SAMPLE_EVENT.location} {...p} />),
  stopCase('EventNote', (p) => <EventNote notes="Bring both jerseys." {...p} />),
  stopCase('TeamBadge', (p) => <TeamBadge teamName="Baltimore Blades" {...p} />),
  stopCase('AuthErrorMessage', (p) => <AuthErrorMessage message="That email is in use." {...p} />),
  stopCase('AuthErrorBanner', (p) => <AuthErrorBanner title="Wrong password." message="Try again." {...p} />),
  stopCase('OrDivider', (p) => <OrDivider {...p} />),
  stopCase('Avatar', (p) => <Avatar name="Jordan Pak" {...p} />, true),
  stopCase('DateTile', (p) => <DateTile month="Nov" day="21" {...p} />, true),
  stopCase('CountBadge', (p) => <CountBadge count={3} {...p} />),
  stopCase('Tag', (p) => <Tag label="Coach" {...p} />),
  stopCase('StepProgress', (p) => <StepProgress current={1} total={3} {...p} />),
  stopCase('AlertBanner', (p) => <AlertBanner title="Not allowed" message="Add a coach." {...p} />),
  stopCase('ListRow (static)', (p) => <ListRow title="Coach Riley" value="Coach" {...p} />),
  stopCase('EventNote (editable)', (p) => <EventNote notes="Bring both jerseys." label="Note for players" onEdit={noop} {...p} />),
  stopCase('DateDivider', (p) => <DateDivider label="Today" {...p} />),
  stopCase('MessageBubble', (p) => <MessageBubble text="See you Thursday!" time="6:17 PM" direction="outgoing" {...p} />),
  stopCase('ChannelMessage', (p) => <ChannelMessage sender="Coach Riley" role="Coach" text="Full gear." time="8:10 PM" {...p} />),
  stopCase('ChannelIdentity', (p) => <ChannelIdentity name="team" detail="Team Name · 18 members" {...p} />),

  // Single controls
  controlCase('AuthButton', (p) => <AuthButton label="Create account" onPress={noop} {...p} />),
  controlCase('AppButton', (p) => <AppButton title="Join team" onPress={noop} {...p} />),
  controlCase('AuthLinkButton', (p) => <AuthLinkButton label="Log in" onPress={noop} {...p} />),
  controlCase('TabBarButton', (p) => <TabBarButton name="teams" focused onPress={noop} {...p} />),
  controlCase('TeamListRow', (p) => <TeamListRow team={TEAM} distanceMiles={12} onPress={noop} {...p} />),
  controlCase('IconButton', (p) => <IconButton icon={CloseIcon} label="Close" onPress={noop} {...p} />),
  controlCase('FilterChip', (p) => <FilterChip label="Unread" selected onPress={noop} {...p} />),
  controlCase('Chip', (p) => <Chip label="Jordan P. · Player" onRemove={noop} {...p} />),
  controlCase('ToggleCard', (p) => <ToggleCard title="Allow location access" description="Find teams near you." value onValueChange={noop} {...p} />),
  controlCase('RadioCard', (p) => <RadioCard title="All messages" description="Every new message" selected onPress={noop} {...p} />),
  controlCase('ChoiceButton', (p) => <ChoiceButton label="8 hours" selected={false} onPress={noop} {...p} />),
  controlCase('ListRow (pressable)', (p) => <ListRow title="Jordan P." subtitle="Player" accessory="selected" onPress={noop} {...p} />),
  controlCase('PickerField', (p) => <PickerField label="Date" placeholder="Select date" onPress={noop} {...p} />),
  controlCase('PhotoButton', (p) => <PhotoButton caption="Add photo (optional)" onPress={noop} {...p} />),
  controlCase('EventCard', (p) => (
    <EventCard
      title="Practice Session"
      start={SAMPLE_EVENT.startTime}
      end={SAMPLE_EVENT.endTime}
      location={SAMPLE_EVENT.location}
      teamName="Baltimore Blades"
      status="Joined"
      onPress={noop}
      {...p}
    />
  )),
  controlCase('NotificationCard', (p) => (
    <NotificationCard title="Schedule change" date="10/28" body="Practice moved to 11/1." avatarName="Baltimore Blades" unread onPress={noop} {...p} />
  )),
  controlCase('ChannelCard', (p) => <ChannelCard name="Admins" time="9:41 PM" lastSender="Coach Sam" lastMessage="Lineup posted" unread={2} onPress={noop} {...p} />),
  controlCase('ConversationRow', (p) => <ConversationRow name="Jordan P." time="9:41 PM" lastMessage="Who is bringing pucks?" unread={2} onPress={noop} {...p} />),
  controlCase('TeamRelationship (follow)', (p) => (
    <TeamRelationship state="not-following" teamName="Baltimore Blades" onToggleFollow={noop} {...p} />
  )),

  // Several stops: screenReaderParts
  {
    name: 'AuthTextField',
    render: (p) => <AuthTextField label="Email" error="Bad email." helperText="We never share it." {...p} />,
    custom: {
      element: (
        <AuthTextField
          label="Email"
          error="Bad email."
          helperText="We never share it."
          screenReaderParts={{
            field: { label: 'field label', hint: 'field hint' },
            error: { label: 'error label' },
            helperText: { label: 'helper label' },
          }}
        />
      ),
      labels: ['field label', 'error label', 'helper label'],
      hints: ['Bad email. field hint'],
    },
  },
  {
    name: 'PasswordField',
    render: (p) => <PasswordField label="Password" value="secret" {...p} />,
    custom: {
      element: (
        <PasswordField
          label="Password"
          value="secret"
          error="Too short."
          helperText="Use 8 characters."
          screenReaderParts={{
            field: { label: 'password label', hint: 'password hint' },
            error: { label: 'password error label' },
            helperText: { label: 'password helper label' },
            showButton: { label: 'show label', hint: 'show hint', pressAnnouncement: 'Password shown' },
            hideButton: { label: 'hide label', pressAnnouncement: 'Password hidden' },
          }}
        />
      ),
      labels: ['password label', 'password error label', 'password helper label', 'show label'],
      hints: ['Too short. password hint', 'show hint'],
      presses: [
        { label: 'show label', announcement: 'Password shown' },
        { label: 'hide label', announcement: 'Password hidden' },
      ],
    },
  },
  {
    name: 'AuthHeader',
    render: (p) => <AuthHeader title="Create an account" onClose={noop} {...p} />,
    custom: {
      element: (
        <AuthHeader
          title="Create an account"
          onClose={noop}
          screenReaderParts={{
            title: { label: 'title label' },
            close: { label: 'close label', hint: 'close hint', pressAnnouncement: 'Closed' },
          }}
        />
      ),
      labels: ['title label', 'close label'],
      hints: ['close hint'],
      presses: [{ label: 'close label', announcement: 'Closed' }],
    },
  },
  {
    name: 'TeamHeader',
    render: (p) => <TeamHeader onBack={noop} onCreate={noop} {...p} />,
    custom: {
      element: (
        <TeamHeader
          onBack={noop}
          onCreate={noop}
          screenReaderParts={{
            back: { label: 'back label', hint: 'back hint', pressAnnouncement: 'Went back' },
            title: { label: 'title label' },
            create: { label: 'create label', hint: 'create hint', pressAnnouncement: 'Creating' },
          }}
        />
      ),
      labels: ['back label', 'title label', 'create label'],
      hints: ['back hint', 'create hint'],
      presses: [
        { label: 'back label', announcement: 'Went back' },
        { label: 'create label', announcement: 'Creating' },
      ],
    },
  },
  {
    name: 'TeamInfoCard',
    render: (p) => <TeamInfoCard name="Baltimore Blades" season="2026–2027" {...p} />,
    custom: {
      element: (
        <TeamInfoCard
          name="Baltimore Blades"
          season="2026–2027"
          screenReaderParts={{ name: { label: 'name label' }, season: { label: 'season label' } }}
        />
      ),
      labels: ['name label', 'season label'],
    },
  },
  {
    name: 'EventHeader',
    render: (p) => <EventHeader title="Haunted Hat Trick" teamName="Baltimore Blades" followed={false} onToggleFollow={noop} {...p} />,
    custom: {
      element: (
        <EventHeader
          title="Haunted Hat Trick"
          teamName="Baltimore Blades"
          followed={false}
          onToggleFollow={noop}
          screenReaderParts={{
            title: { label: 'title label' },
            team: { label: 'team label' },
            follow: { label: 'follow label', hint: 'follow hint', pressAnnouncement: 'Now following' },
          }}
        />
      ),
      labels: ['title label', 'team label', 'follow label'],
      hints: ['follow hint'],
      presses: [{ label: 'follow label', announcement: 'Now following' }],
    },
  },
  {
    name: 'RsvpSection (no reply)',
    render: (p) => <RsvpSection value={null} onChange={noop} {...p} />,
    custom: {
      element: (
        <RsvpSection
          value={null}
          onChange={noop}
          screenReaderParts={{
            heading: { label: 'heading label' },
            going: { label: 'going label', hint: 'going hint', pressAnnouncement: 'Going saved' },
            maybe: { label: 'maybe label', pressAnnouncement: 'Maybe saved' },
            cantGo: { label: 'cant go label', pressAnnouncement: "Can't go saved" },
          }}
        />
      ),
      labels: ['heading label', 'going label', 'maybe label', 'cant go label'],
      hints: ['going hint'],
      presses: [
        { label: 'going label', announcement: 'Going saved' },
        { label: 'maybe label', announcement: 'Maybe saved' },
        { label: 'cant go label', announcement: "Can't go saved" },
      ],
    },
  },
  {
    name: 'RsvpSection (answered)',
    render: (p) => <RsvpSection value="going" onChange={noop} {...p} />,
    custom: {
      element: (
        <RsvpSection
          value="going"
          onChange={noop}
          screenReaderParts={{
            reply: { label: 'reply label' },
            edit: { label: 'edit label', hint: 'edit hint', pressAnnouncement: 'Editing reply' },
          }}
        />
      ),
      labels: ['reply label', 'edit label'],
      hints: ['edit hint'],
      presses: [{ label: 'edit label', announcement: 'Editing reply' }],
    },
  },
  {
    name: 'InviteMessage',
    render: (p) => <InviteMessage teamName="Baltimore Blades" {...p} />,
    custom: {
      element: (
        <InviteMessage
          teamName="Baltimore Blades"
          screenReaderParts={{ heading: { label: 'heading label' }, body: { label: 'body label' } }}
        />
      ),
      labels: ['heading label', 'body label'],
    },
  },
  {
    name: 'InviteActions',
    render: (p) => <InviteActions onCreateAccount={noop} onLogIn={noop} {...p} />,
    custom: {
      element: (
        <InviteActions
          onCreateAccount={noop}
          onLogIn={noop}
          screenReaderParts={{
            createAccount: { label: 'create label', hint: 'create hint', pressAnnouncement: 'Opening sign-up' },
            logIn: { label: 'log in label', hint: 'log in hint', pressAnnouncement: 'Opening log in' },
          }}
        />
      ),
      labels: ['create label', 'log in label'],
      hints: ['create hint', 'log in hint'],
      presses: [
        { label: 'create label', announcement: 'Opening sign-up' },
        { label: 'log in label', announcement: 'Opening log in' },
      ],
    },
  },
  {
    name: 'RequestSentMessage',
    render: (p) => <RequestSentMessage {...p} />,
    custom: {
      element: <RequestSentMessage screenReaderParts={{ title: { label: 'title label' }, body: { label: 'body label' } }} />,
      labels: ['title label', 'body label'],
    },
  },
  {
    name: 'VerifyEmailContent',
    render: (p) => (
      <VerifyEmailContent
        email="player@example.com"
        isLoadingUser={false}
        isResending={false}
        message={{ type: 'success', text: 'Sent.' }}
        onBack={noop}
        onClose={noop}
        onResend={noop}
        {...p}
      />
    ),
    custom: {
      element: (
        <VerifyEmailContent
          email="player@example.com"
          isLoadingUser={false}
          isResending={false}
          message={{ type: 'success', text: 'Sent.' }}
          onBack={noop}
          onClose={noop}
          onResend={noop}
          screenReaderParts={{
            back: { label: 'back label', hint: 'back hint', pressAnnouncement: 'Went back' },
            title: { label: 'title label' },
            close: { label: 'close label', hint: 'close hint', pressAnnouncement: 'Closed' },
            instructions: { label: 'instructions label' },
            feedback: { label: 'feedback label' },
            resend: { label: 'resend label', hint: 'resend hint', pressAnnouncement: 'Resending' },
            expiry: { label: 'expiry label' },
          }}
        />
      ),
      labels: ['back label', 'title label', 'close label', 'instructions label', 'feedback label', 'resend label', 'expiry label'],
      hints: ['back hint', 'close hint', 'resend hint'],
      presses: [
        { label: 'back label', announcement: 'Went back' },
        { label: 'close label', announcement: 'Closed' },
        { label: 'resend label', announcement: 'Resending' },
      ],
    },
  },
  {
    name: 'EventDetails',
    render: (p) => <EventDetails event={SAMPLE_EVENT} teamName="Baltimore Blades" onAddToCalendar={noop} {...p} />,
    custom: {
      element: (
        <EventDetails
          event={SAMPLE_EVENT}
          teamName="Baltimore Blades"
          onAddToCalendar={noop}
          screenReaderParts={{
            header: { title: { label: 'title label' }, team: { label: 'team label' }, follow: { label: 'follow label' } },
            dateTime: { label: 'date label' },
            location: { label: 'location label' },
            addToCalendar: { label: 'calendar label', hint: 'calendar hint', pressAnnouncement: 'Added' },
            rsvp: { heading: { label: 'rsvp label' }, going: { label: 'going label', pressAnnouncement: 'Going saved' } },
            note: { label: 'note label' },
          }}
        />
      ),
      labels: ['title label', 'team label', 'follow label', 'date label', 'location label', 'calendar label', 'rsvp label', 'going label', 'note label'],
      hints: ['calendar hint'],
      presses: [
        { label: 'calendar label', announcement: 'Added' },
        { label: 'going label', announcement: 'Going saved' },
      ],
    },
  },

  // New Figma building blocks with several stops
  {
    name: 'ScreenHeader',
    render: (p) => <ScreenHeader title="New Event" leading={{ kind: 'back', onPress: noop }} trailing={{ kind: 'text', text: 'Edit', onPress: noop }} {...p} />,
    custom: {
      element: (
        <ScreenHeader
          title="New Event"
          leading={{ kind: 'back', onPress: noop, label: 'back label', hint: 'back hint', pressAnnouncement: 'Went back' }}
          trailing={{ kind: 'text', text: 'Edit', onPress: noop, label: 'edit label', pressAnnouncement: 'Editing' }}
          screenReaderParts={{ title: { label: 'header title label' } }}
        />
      ),
      labels: ['back label', 'header title label', 'edit label'],
      hints: ['back hint'],
      presses: [
        { label: 'back label', announcement: 'Went back' },
        { label: 'edit label', announcement: 'Editing' },
      ],
    },
  },
  {
    name: 'SegmentedControl',
    render: (p) => (
      <SegmentedControl label="Feed" value="forYou" onChange={noop} options={[{ value: 'forYou', label: 'For You' }, { value: 'discover', label: 'Discover' }]} {...p} />
    ),
    custom: {
      element: (
        <SegmentedControl
          label="Feed"
          value="forYou"
          onChange={noop}
          options={[{ value: 'forYou', label: 'For You' }, { value: 'discover', label: 'Discover' }]}
          screenReaderParts={{ discover: { label: 'discover label', hint: 'discover hint', pressAnnouncement: 'Discover shown' } }}
        />
      ),
      labels: ['discover label'],
      hints: ['discover hint'],
      presses: [{ label: 'discover label', announcement: 'Discover shown' }],
    },
  },
  {
    name: 'TabStrip',
    render: (p) => <TabStrip value="channels" onChange={noop} tabs={[{ value: 'channels', label: 'Channels' }, { value: 'messages', label: 'Messages', count: 3 }]} {...p} />,
    custom: {
      element: (
        <TabStrip
          value="channels"
          onChange={noop}
          tabs={[{ value: 'channels', label: 'Channels' }, { value: 'messages', label: 'Messages', count: 3 }]}
          screenReaderParts={{ messages: { label: 'messages label', hint: 'messages hint', pressAnnouncement: 'Messages shown' } }}
        />
      ),
      labels: ['messages label'],
      hints: ['messages hint'],
      presses: [{ label: 'messages label', announcement: 'Messages shown' }],
    },
  },
  {
    name: 'SectionHeader',
    render: (p) => <SectionHeader title="Schedule" action={{ label: 'See all', onPress: noop }} {...p} />,
    custom: {
      element: (
        <SectionHeader
          title="Schedule"
          action={{ label: 'See all', onPress: noop }}
          screenReaderParts={{ title: { label: 'section label' }, action: { label: 'see all label', hint: 'see all hint', pressAnnouncement: 'Opened' } }}
        />
      ),
      labels: ['section label', 'see all label'],
      hints: ['see all hint'],
      presses: [{ label: 'see all label', announcement: 'Opened' }],
    },
  },
  {
    name: 'CenteredMessage',
    render: (p) => <CenteredMessage title="Password updated" message="Log in with your new password." {...p} />,
    custom: {
      element: (
        <CenteredMessage
          title="Password updated"
          message="Log in with your new password."
          screenReaderParts={{ title: { label: 'message title label' }, message: { label: 'message body label' } }}
        />
      ),
      labels: ['message title label', 'message body label'],
    },
  },
  {
    name: 'ListGroup',
    render: (p) => <ListGroup rows={[{ key: 'notify', title: 'Notify me about', subtitle: 'All messages', accessory: 'chevron', onPress: noop }]} {...p} />,
    custom: {
      element: (
        <ListGroup
          rows={[
            { key: 'notify', title: 'Notify me about', onPress: noop, screenReaderLabel: 'notify label', screenReaderHint: 'notify hint', screenReaderPressAnnouncement: 'Opened notify' },
          ]}
        />
      ),
      labels: ['notify label'],
      hints: ['notify hint'],
      presses: [{ label: 'notify label', announcement: 'Opened notify' }],
    },
  },
  {
    name: 'SelectField',
    render: (p) => <SelectField label="Gender" options={[{ value: 'f', label: 'Female' }]} onChange={noop} {...p} />,
    custom: {
      element: (
        <SelectField
          label="Gender"
          options={[{ value: 'f', label: 'Female' }]}
          onChange={noop}
          screenReaderParts={{ field: { label: 'gender label', hint: 'gender hint', pressAnnouncement: 'Options shown' } }}
        />
      ),
      labels: ['gender label'],
      hints: ['gender hint'],
      presses: [{ label: 'gender label', announcement: 'Options shown' }],
    },
  },
  {
    name: 'SearchField',
    render: (p) => <SearchField placeholder="Search by name" {...p} />,
    custom: {
      element: <SearchField placeholder="Search by name" label="search label" hint="search hint" />,
      labels: ['search label'],
      hints: ['search hint'],
    },
  },
  {
    name: 'RangeSlider',
    render: (p) => <RangeSlider label="Age range" valueName="age" min={0} max={99} low={12} high={40} onChange={noop} {...p} />,
    custom: {
      element: (
        <RangeSlider
          label="Age range"
          min={0}
          max={99}
          low={12}
          high={40}
          onChange={noop}
          screenReaderParts={{ low: { label: 'youngest', hint: 'youngest hint' }, high: { label: 'oldest' } }}
        />
      ),
      labels: ['youngest', 'oldest', 'youngest slider'],
      hints: ['youngest hint'],
    },
  },
  {
    name: 'MessageComposer',
    render: (p) => <MessageComposer value="" onChangeText={noop} onSend={noop} onAttach={noop} placeholder="Message Jordan P." {...p} />,
    custom: {
      element: (
        <MessageComposer
          value=""
          onChangeText={noop}
          onSend={noop}
          onAttach={noop}
          placeholder="Message Jordan P."
          screenReaderParts={{ attach: { label: 'attach label', hint: 'attach hint', pressAnnouncement: 'Attaching' }, input: { label: 'input label' } }}
        />
      ),
      labels: ['attach label', 'input label'],
      hints: ['attach hint'],
      presses: [{ label: 'attach label', announcement: 'Attaching' }],
    },
  },
  {
    name: 'RsvpReplies',
    render: (p) => <RsvpReplies heading="Replies" groups={[{ label: 'going', names: ['Jordan P.'] }]} onSeeAll={noop} {...p} />,
    custom: {
      element: (
        <RsvpReplies
          groups={[{ label: 'going', names: ['Jordan P.'] }]}
          onSeeAll={noop}
          screenReaderParts={{ seeAll: { label: 'replies label', hint: 'replies hint', pressAnnouncement: 'All replies' } }}
        />
      ),
      labels: ['replies label'],
      hints: ['replies hint'],
      presses: [{ label: 'replies label', announcement: 'All replies' }],
    },
  },
  {
    name: 'TeamCard',
    render: (p) => <TeamCard name="Baltimore Blades" ages="Ages 12 to 40" city="Baltimore" following={false} onToggleFollow={noop} {...p} />,
    custom: {
      element: (
        <TeamCard
          name="Baltimore Blades"
          ages="Ages 12 to 40"
          city="Baltimore"
          following={false}
          onToggleFollow={noop}
          screenReaderParts={{ summary: { label: 'team summary label' }, follow: { label: 'team follow label', hint: 'team follow hint', pressAnnouncement: 'Followed team' } }}
        />
      ),
      labels: ['team summary label', 'team follow label'],
      hints: ['team follow hint'],
      presses: [{ label: 'team follow label', announcement: 'Followed team' }],
    },
  },
  {
    name: 'HomeHeader',
    render: (p) => <HomeHeader onNotificationsPress={noop} hasUnread {...p} />,
    custom: {
      element: (
        <HomeHeader
          onNotificationsPress={noop}
          screenReaderParts={{ logo: { label: 'logo label' }, notifications: { label: 'bell label', hint: 'bell hint', pressAnnouncement: 'Opened notifications' } }}
        />
      ),
      labels: ['logo label', 'bell label'],
      hints: ['bell hint'],
      presses: [{ label: 'bell label', announcement: 'Opened notifications' }],
    },
  },
  {
    name: 'AnnouncementHeader',
    render: (p) => <AnnouncementHeader title="Practice moved" sender="Coach Seonasa" recipients="Baltimore Blades" sentAt="Oct 28 at 4:12 pm" {...p} />,
    custom: {
      element: (
        <AnnouncementHeader
          title="Practice moved"
          sender="Coach Seonasa"
          recipients="Baltimore Blades"
          sentAt="Oct 28 at 4:12 pm"
          screenReaderParts={{ title: { label: 'announcement title label' }, sender: { label: 'sender label' } }}
        />
      ),
      labels: ['announcement title label', 'sender label'],
    },
  },
  {
    name: 'ChatListHeader',
    render: (p) => <ChatListHeader title="Team Name" onTitlePress={noop} onSettingsPress={noop} {...p} />,
    custom: {
      element: (
        <ChatListHeader
          title="Team Name"
          onTitlePress={noop}
          onSettingsPress={noop}
          screenReaderParts={{
            title: { label: 'switch label', hint: 'switch hint', pressAnnouncement: 'Team list open' },
            settings: { label: 'settings label', pressAnnouncement: 'Settings open' },
          }}
        />
      ),
      labels: ['switch label', 'settings label'],
      hints: ['switch hint'],
      presses: [
        { label: 'switch label', announcement: 'Team list open' },
        { label: 'settings label', announcement: 'Settings open' },
      ],
    },
  },
  {
    name: 'ConversationHeader',
    render: (p) => <ConversationHeader title="Jordan P." subtitle="Coach" onBack={noop} onInfo={noop} {...p} />,
    custom: {
      element: (
        <ConversationHeader
          title="Jordan P."
          subtitle="Coach"
          onBack={noop}
          onInfo={noop}
          screenReaderParts={{
            back: { label: 'convo back label', pressAnnouncement: 'Back to messages' },
            title: { label: 'convo title label' },
            info: { label: 'info label', hint: 'info hint', pressAnnouncement: 'Info open' },
          }}
        />
      ),
      labels: ['convo back label', 'convo title label', 'info label'],
      hints: ['info hint'],
      presses: [
        { label: 'convo back label', announcement: 'Back to messages' },
        { label: 'info label', announcement: 'Info open' },
      ],
    },
  },
  {
    name: 'TeamSwitcherMenu',
    render: (p) => (
      <TeamSwitcherMenu
        selectedId="a"
        onSelect={noop}
        teams={[{ id: 'a', name: 'Team Name', role: 'Coach', memberCount: 18 }, { id: 'b', name: 'Team Name 2', initials: 'T2', role: 'Player', memberCount: 16, unread: 4 }]}
        {...p}
      />
    ),
  },
  {
    name: 'Calendar',
    render: (p) => <Calendar month={new Date(2026, 10, 1)} today={new Date(2026, 10, 15)} onMonthChange={noop} onSelect={noop} {...p} />,
  },

  // Layout utilities: no reading stop of their own, so only hide and order apply.
  {
    name: 'SlidingPages',
    render: (p) => (
      <SlidingPages activeIndex={0} reduceMotion {...p}>
        {[<Text key="details">Your details</Text>, <Text key="team">Your team</Text>]}
      </SlidingPages>
    ),
  },
  {
    name: 'AccessibilityOrder',
    render: (p) => (
      <AccessibilityOrder order={[]} {...p}>
        <Text>Grouped content</Text>
      </AccessibilityOrder>
    ),
  },
];

const originalOS = Platform.OS;

beforeEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
});

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  jest.restoreAllMocks();
});

function Probe() {
  const nativeID = useScreenReaderOrder(2);
  return <Text nativeID={nativeID}>probe</Text>;
}

const hosts = () => screen.container.queryAll((node) => typeof node.type === 'string');
const CONTROL_ROLES = ['button', 'tab', 'radio', 'switch', 'checkbox'];

describe.each(cases)('$name', ({ render: renderWith, custom }) => {
  it('takes its screenReaderOrder position in the page', async () => {
    await render(
      <ScreenReaderOrderScope testID="scope">
        <Probe />
        {renderWith({ screenReaderOrder: 1 })}
      </ScreenReaderOrderScope>,
    );
    const order: string[] = screen.getByTestId('scope').props.experimental_accessibilityOrder;
    expect(order).toHaveLength(2);
    expect(order[1]).toBe(screen.getByText('probe').props.nativeID);
    expect(hosts().filter((node) => node.props.nativeID === order[0])).toHaveLength(1);
  });

  it('is skipped by screen readers with hideFromScreenReader', async () => {
    await render(renderWith({ hideFromScreenReader: true }));
    expect(hosts().length).toBeGreaterThan(0);
    for (const node of hosts()) expect(isHiddenFromAccessibility(node)).toBe(true);
  });

  if (custom?.presses?.length) {
    it('leaves the web Tab order when hidden', async () => {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
      await render(renderWith({ hideFromScreenReader: true }));
      const controls = hosts().filter(
        (node) => node.type === 'TextInput' || CONTROL_ROLES.includes(node.props.accessibilityRole),
      );
      expect(controls.length).toBeGreaterThan(0);
      for (const node of controls) expect(node.props.tabIndex).toBe(-1);
    });
  }

  if (custom) {
    it('reads the custom labels and hints', async () => {
      await render(custom.element);
      // getAll: the RSVP heading label also names its option group.
      for (const label of custom.labels) expect(screen.getAllByLabelText(label).length).toBeGreaterThan(0);
      for (const hint of custom.hints ?? []) expect(screen.getByHintText(hint)).toBeTruthy();
    });
  }

  if (custom?.presses?.length) {
    it('speaks the custom press announcements', async () => {
      const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
      await render(custom.element);
      for (const { label, announcement } of custom.presses ?? []) {
        await fireEvent.press(screen.getByLabelText(label));
        expect(announce).toHaveBeenLastCalledWith(announcement);
      }
    });
  }
});

it.each(cases.filter((c) => c.decorative))('$name is hidden from screen readers by default', async ({ render: renderWith }) => {
  await render(renderWith({ hideFromScreenReader: undefined }));
  for (const node of hosts()) expect(isHiddenFromAccessibility(node)).toBe(true);
});

// ActionSheet opens in a Modal, whose host element can't take the hidden props, so it is tested on its own.
describe('ActionSheet', () => {
  it('reads its actions and Cancel, and speaks the custom press announcement', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
    const onClose = jest.fn();
    await render(
      <ActionSheet
        visible
        title="Profile photo"
        onClose={onClose}
        actions={[{ key: 'take', label: 'Take photo', onPress: noop, screenReader: { label: 'take label', hint: 'take hint', pressAnnouncement: 'Camera open' } }]}
      />,
    );
    expect(screen.getByHintText('take hint')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('take label'));
    expect(announce).toHaveBeenLastCalledWith('Camera open');
    await fireEvent.press(screen.getByLabelText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
