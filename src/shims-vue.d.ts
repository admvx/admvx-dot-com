declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

declare module '*/work.yaml' {
  
  export enum WorkTag {
    typescript = 'typescript',
    angular = 'angular',
    design = 'design',
    twitter = 'twitter'
  };
  
  export interface WorkEntry {
    id: string,
    title: string,
    tall_title: boolean,
    page_title?: string,
    subtitle: string,
    aria_title?: string,
    image_description: string,
    fallback_extension?: string,
    body: string,
    false_body?: string,
    processed?: boolean,
    date: Date,
    dateString?: string,
    link: {
      url: string,
      text: string,
      hover: string,
    },
    tags: WorkTag[]
  }
  
  const workEntries: WorkEntry[];
  export default workEntries;
}
