// Audit log 枚举值的本地化映射。
// 数据库存储保留英文枚举（程序契约），UI 层用本模块转中文。
// 未知枚举值 fallback 到原值，确保渲染不中断。
type TFunc = (key: string) => string;

export interface AuditLabeler {
  action: (value: string) => string;
  target: (value: string) => string;
}

export function makeAuditLabeler(t: TFunc): AuditLabeler {
  const actionMap: Record<string, string> = {
    create: t("audit.action.create"),
    update: t("audit.action.update"),
    delete: t("audit.action.delete"),
    login: t("audit.action.login"),
    logout: t("audit.action.logout"),
  };
  const targetMap: Record<string, string> = {
    user: t("audit.target.user"),
    essay: t("audit.target.essay"),
    agent: t("audit.target.agent"),
    asset: t("audit.target.asset"),
    asset_link: t("audit.target.asset_link"),
    tag: t("audit.target.tag"),
    timeline_node: t("audit.target.timeline_node"),
    site_config: t("audit.target.site_config"),
  };
  return {
    action: (v) => actionMap[v] ?? v,
    target: (v) => targetMap[v] ?? v,
  };
}
