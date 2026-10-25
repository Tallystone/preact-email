import * as React from "react";
import OuterTemplate from "./components/OuterTemplate";
import InnerTemplate from "./components/InnerTemplate";

interface InviteDataRoomProps {
  userName: string;
  inviteSenderEntityName: string;
  inviteDataRoomName: string;
  linkUrl: string;
  inviteExpiryDate: string;
  currentYear: string;
  supportEmail: string;
}

export const InviteDataRoom = ({
  userName,
  inviteSenderEntityName,
  inviteDataRoomName,
  linkUrl,
  inviteExpiryDate,
  currentYear,
  supportEmail,
}: InviteDataRoomProps) => (
  <OuterTemplate
    currentYear={currentYear}
    preview={`Join ${inviteSenderEntityName} on Tallystone.`}
  >
    <InnerTemplate
      userName={userName}
      bodyText={
        <>
          <b>{inviteSenderEntityName}</b> has invited you to access their data
          room <b>{inviteDataRoomName}</b> on Tallystone.
        </>
      }
      buttonText="Access data room"
      buttonLink={linkUrl}
      brokenWarning={true}
      expiresAt={inviteExpiryDate}
      enableDescription
      supportEmail={supportEmail}
    />
  </OuterTemplate>
);

InviteDataRoom.Subject = (props: InviteDataRoomProps) =>
  `${props.inviteSenderEntityName} has invited you to their data room`;

InviteDataRoom.PreviewProps = {
  userName: "John Doe",
  inviteSenderEntityName: "ABC Pty Ltd",
  inviteDataRoomName: "Acme Data Room",
  linkUrl: "https://app.tallystone.com/invite",
  inviteExpiryDate: "30/03/2025",
  currentYear: "2025",
  supportEmail: "support@tallystone.com",
} satisfies InviteDataRoomProps;

export default InviteDataRoom;
