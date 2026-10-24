# Excel files and WhatsApp connection status

## Available: local Excel / CSV analysis

Owners, managers and HR can open **People → 人力资源表格** and select an actual `.xlsx` or `.csv` file. Owners and managers also have a shortcut from **Connect → Microsoft Excel / CSV**. Files are processed entirely in the browser and are not uploaded or sent to OpenAI.

The first visible worksheet is read. Required columns: `name`, `team`, `skill`, `capacity`; Chinese aliases `姓名`, `部门` / `团队`, `技能`, `可用工时` / `可用小时` are accepted in Excel. Capacity is 0–24 hours; analysis is limited to 200 employee records and a 1 MB file. Formula cells are rejected: paste values in Excel first. Old `.xls` and encrypted workbooks are not supported; save as `.xlsx`. This feature analyses the resource table; it does not overwrite the employee directory or synchronize files with OneDrive.

fflate 0.8.3 (MIT) provides ZIP decompression, with its original notice under `THIRD_PARTY_LICENSES`. The importer limits selected expanded XML to 4 MB and rejects malformed files, missing fields, duplicate headers and excessive rows. External XML entities and formula evaluation are not permitted.

Browser verification used a synthetic `.xlsx` file with Amir at 5 hours and Daniel at 0 hours. The result correctly showed 2 employees, 5 total hours and 1 unavailable employee. Unit coverage includes CSV compatibility, Chinese headers, limits and corrupt archives.

## Not connected: Microsoft 365 cloud workbooks

The user currently has local Excel, not a configured Microsoft 365 connection. OneDrive / SharePoint synchronization and Microsoft account OAuth have not been implemented. File import must not be described as a Microsoft Graph API connection.

## Not connected: WhatsApp

The user currently has an ordinary WhatsApp account, not WhatsApp Business Platform authorization. Connect now shows the actual unconnected state and a setup guide with an official Meta link. It does not claim that a mock test enabled real messages.

Real integration still requires Meta app / enterprise messaging configuration, authorized phone number ID, scoped credentials, verified webhooks and an implementation of receiving/sending that honours message and opt-in rules. No private WhatsApp account, personal chat history or WhatsApp Web session is scraped or embedded. Other payment / CRM / payroll / commerce cards remain explicitly marked as proposed interfaces and sample events.

Official references: [Microsoft Graph Excel overview](https://learn.microsoft.com/en-us/graph/excel-concept-overview), [WhatsApp developer hub](https://whatsappbusiness.com/developers/developer-hub/), [fflate source and MIT license](https://github.com/101arrowz/fflate).
