import {
  CodeInline,
  Column,
  Heading,
  Link,
  Row,
  Section,
  Text,
} from '@hillac/preact-email';
import { ActionPanel, EmailShell, styles } from './components/layout.js';

export interface CommunityDigestProps {
  recipient?: string;
  storyCount: number;
  showEditorNote: boolean;
}
function StoryCard({ index }: { index: number }) {
  return (
    <Section
      style={{
        ...styles.card,
        backgroundColor: index % 2 ? '#fffaf0' : '#f6faf8',
      }}
    >
      <Row>
        <Column>
          <Heading as="h3" style={{ fontSize: '17px', margin: '0 0 8px' }}>
            Field dispatch {index + 1}
          </Heading>
        </Column>
        <Column align="right">
          <Text style={styles.small}>{index % 2 ? 'Coast' : 'Forest'}</Text>
        </Column>
      </Row>
      <Text style={styles.text}>
        Small observations, generous landscapes. This week&apos;s route pairs
        quiet paths with a new community story.
      </Text>
      <Link
        href={`https://example.com/journal/${index + 1}?source=digest&edition=spring`}
        style={styles.link}
      >
        Read dispatch {index + 1}
      </Link>
    </Section>
  );
}
export default function CommunityDigest({
  recipient,
  storyCount,
  showEditorNote,
}: CommunityDigestProps) {
  return (
    <EmailShell preview="Fresh observations from the Fern Post community.">
      <ActionPanel
        recipient={recipient}
        introduction={
          <>
            Your reading list contains <strong>{storyCount}</strong> fresh
            dispatches. Take them at your own pace.
          </>
        }
        note={
          showEditorNote
            ? {
                title: 'From the editor’s notebook',
                content: (
                  <>
                    “Look closely, walk lightly.”
                    <br />A small reminder for the season ahead.
                  </>
                ),
              }
            : undefined
        }
        postscript={
          <>
            Subscriber reference: <CodeInline>FP-SPRING-31</CodeInline>
          </>
        }
      >
        <Heading as="h2" style={{ color: '#213b39', fontSize: '21px' }}>
          Around the community
        </Heading>
        {storyCount === 0 ? (
          <Text style={styles.text}>
            The notebook is resting this week. New dispatches arrive next
            Friday.
          </Text>
        ) : (
          Array.from({ length: storyCount }, (_, index) => (
            <StoryCard key={index} index={index} />
          ))
        )}
        <div data-skip-in-text="true">
          <Text style={styles.small}>
            Decorative edition marker: SPRING-ART
          </Text>
        </div>
        <Text style={styles.text}>Weekend ideas:</Text>
        <ul>
          <li>Sketch a familiar tree.</li>
          <li>Share a favourite trail snack.</li>
          <li>Invite a friend for a short walk.</li>
        </ul>
      </ActionPanel>
    </EmailShell>
  );
}
export const scenarios = [
  {
    name: 'editorial',
    props: { recipient: 'Noor', storyCount: 4, showEditorNote: true },
    contains: [
      'FIELD DISPATCH 4',
      'FP-SPRING-31',
      'From the editor’s notebook',
    ],
    excludes: [
      'SPRING-ART',
      'Fresh observations from the Fern Post community.',
    ],
  },
  {
    name: 'large-mapped-collection',
    props: { recipient: 'Robin', storyCount: 32, showEditorNote: false },
    contains: ['FIELD DISPATCH 32', '32 fresh dispatches'],
    excludes: ['From the editor’s notebook', 'SPRING-ART'],
  },
  {
    name: 'empty-collection-no-recipient',
    props: { storyCount: 0, showEditorNote: false },
    contains: ['0 fresh dispatches', 'The notebook is resting'],
    excludes: ['A new chapter', 'FIELD DISPATCH 1', 'SPRING-ART'],
  },
] satisfies Array<{
  name: string;
  props: CommunityDigestProps;
  contains: string[];
  excludes: string[];
}>;

// Change the scenario index to preview another fixture variant.
CommunityDigest.PreviewProps = scenarios[0]!.props;
