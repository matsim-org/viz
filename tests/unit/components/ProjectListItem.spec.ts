import ProjectListItem from '@/components/ProjectListItem.vue'

describe('ProjectListItem', () => {
  it('should be instanceable', () => {
    expect(new ProjectListItem({ props: { projectStore: Object, project: Object } })).toBeInstanceOf(ProjectListItem)
  })
})
