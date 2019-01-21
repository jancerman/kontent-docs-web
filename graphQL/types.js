const TYPE_DEFINITION = `type SystemInfo {
  id: String!
  name: String!
  codename: String!
  language: String!
  type: String!
  lastModified: String!
}
interface ContentItem {
  system: SystemInfo!
}
type MultipleChoiceElementOption {
  name: String!
  codename: String
}
type TaxonomyTerm {
  name: String!
  codename: String
}
type Asset {
  name: String
  type: String
  size: Int
  description: String
  url: String
}
type Link {
  codename: String
  itemID: String
  urlSlug: String
  type: String
}
type TextElement {
  type: String!
  name: String!
  value: String
}
type NumberElement {
  type: String!
  name: String!
  value: String
  number: Int
}
type DateTimeElement {
  type: String!
  name: String!
  value: String
  datetime: String
}
type MultipleChoiceElement {
  type: String!
  name: String!
  value: String
  options: [MultipleChoiceElementOption]
}
type UrlSlugElement {
  type: String!
  name: String!
  value: String
  data: String
}
type TaxonomyElement {
  type: String!
  name: String!
  value: String
  taxonomyGroup: String
  taxonomyTerms: [TaxonomyTerm]
}
type AssetElement {
  type: String!
  name: String!
  value: String
  assets: [Asset]
}
type RichTextElement {
  type: String!
  name: String!
  value: String
  linkedItemCodenames: [String]
  links: [Link]
}

type ArticleContentType implements ContentItem {
  system: SystemInfo!
  author: [ContentItem]
  content_layout: MultipleChoiceElement
  audience: TaxonomyElement
  notes: RichTextElement
  content: RichTextElement
  content_type: TaxonomyElement
  url: UrlSlugElement
  short_title: TextElement
  platforms: TaxonomyElement
  description: TextElement
  title: TextElement
  children: [ContentItem]
  next_step: [ContentItem]
  vanity_urls: TextElement
  previous_step: [ContentItem]
}

type AuthorContentType implements ContentItem {
  system: SystemInfo!
  photo: AssetElement
  name: TextElement
}

type CalloutContentType implements ContentItem {
  system: SystemInfo!
  content: RichTextElement
  type: MultipleChoiceElement
}

type CodeSampleContentType implements ContentItem {
  system: SystemInfo!
  code: TextElement
  programming_language: TaxonomyElement
}

type CodeSamplesContentType implements ContentItem {
  system: SystemInfo!
  javascript: TextElement
  javarx: TextElement
  csharp: TextElement
  java: TextElement
  php: TextElement
  typescript: TextElement
  ruby: TextElement
  swift: TextElement
  curl: TextElement
}

type ConfigurationContentType implements ContentItem {
  system: SystemInfo!
  name: TextElement
  description: TextElement
}

type ContentSwitcherContentType implements ContentItem {
  system: SystemInfo!
  children: [ContentItem]
}

type EmbeddedContentContentType implements ContentItem {
  system: SystemInfo!
  title: TextElement
  provider: MultipleChoiceElement
  id: TextElement
}

type HomeContentType implements ContentItem {
  system: SystemInfo!
  title: TextElement
  description: RichTextElement
  navigation: [ContentItem]
  signposts: RichTextElement
}

type ImageContentType implements ContentItem {
  system: SystemInfo!
  zoomable: MultipleChoiceElement
  description: RichTextElement
  image_width: MultipleChoiceElement
  image: AssetElement
}

type InstructionsContentType implements ContentItem {
  system: SystemInfo!
  platforms: TaxonomyElement
  title: TextElement
  content: RichTextElement
}

type NavigationItemContentType implements ContentItem {
  system: SystemInfo!
  title: TextElement
  url: UrlSlugElement
  children: [ContentItem]
}

type PlatformOptionContentType implements ContentItem {
  system: SystemInfo!
  image: AssetElement
  description: TextElement
  link: [ContentItem]
}

type ReleaseNotesContentType implements ContentItem {
  system: SystemInfo!
  new_features: RichTextElement
  fixed_issues: RichTextElement
  api_changes: RichTextElement
  other_notes: RichTextElement
}

type ScenarioContentType implements ContentItem {
  system: SystemInfo!
  description: TextElement
  intended_audience: TaxonomyElement
  notes: RichTextElement
  url: UrlSlugElement
  title: TextElement
  short_title: TextElement
  children: [ContentItem]
  content: RichTextElement
}

type SignpostContentType implements ContentItem {
  system: SystemInfo!
  title: TextElement
  description: RichTextElement
  content: RichTextElement
}

type SignpostLinkContentType implements ContentItem {
  system: SystemInfo!
  title: TextElement
  url: TextElement
}

type TopicContentType implements ContentItem {
  system: SystemInfo!
  children: [ContentItem]
  url: UrlSlugElement
  title: TextElement
}`;

module.exports = {
  TYPE_DEFINITION
}