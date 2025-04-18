import type { TranslationKey } from '~/types/i18n/keys';

const viTranslations: Record<TranslationKey, string> = {
  appName: 'Quote Tool Deluxe',
  'auth.signIn.emailLabel': 'Email',
  'auth.signIn.errorInvalidCredentials': 'Email hoặc mật khẩu không hợp lệ.',
  'auth.signIn.errorRequiredFields': 'Vui lòng điền cả email và mật khẩu.',
  'auth.signIn.errorUnexpected': 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.',
  'auth.signIn.passwordLabel': 'Mật khẩu',
  'auth.signIn.signUpLink': 'Đăng ký',
  'auth.signIn.signUpPrompt': 'Chưa có tài khoản?',
  'auth.signIn.submitButton': 'Đăng nhập',
  'auth.signIn.subtitle': 'Nhập thông tin đăng nhập để truy cập tài khoản của bạn',
  'auth.signIn.title': 'Đăng nhập',
  'auth.signUp.confirmPasswordLabel': 'Xác nhận Mật khẩu',
  'auth.signUp.emailLabel': 'Email',
  'auth.signUp.errorPasswordTooShort': 'Mật khẩu phải có ít nhất {min} ký tự.',
  'auth.signUp.errorPasswordsDoNotMatch': 'Mật khẩu không khớp.',
  'auth.signUp.errorSignInFailed':
    'Đăng ký thành công, nhưng không thể tự động đăng nhập. Vui lòng thử đăng nhập thủ công.',
  'auth.signUp.errorUnexpected':
    'Đã xảy ra lỗi không mong muốn trong quá trình đăng ký. Vui lòng thử lại.',
  'auth.signUp.nameLabel': 'Tên',
  'auth.signUp.passwordHint': 'Tối thiểu {min} ký tự',
  'auth.signUp.passwordLabel': 'Mật khẩu',
  'auth.signUp.signInLink': 'Đăng nhập',
  'auth.signUp.signInPrompt': 'Đã có tài khoản?',
  'auth.signUp.submitButton': 'Đăng ký',
  'auth.signUp.subtitle': 'Tạo tài khoản của bạn để bắt đầu',
  'auth.signUp.title': 'Đăng ký',
  'common.actions': 'Hành động',
  'common.back': 'Quay lại',
  'common.close': 'Đóng',
  'common.closeSidebar': 'Đóng thanh bên',
  'common.create': 'Tạo mới',
  'common.delete': 'Xóa',
  'common.edit': 'Sửa',
  'common.error': 'Lỗi',
  'common.loading': 'Đang tải...',
  'common.noDescription': 'Không có mô tả.',
  'common.noResults': 'Không tìm thấy kết quả nào',
  'common.new': 'Mới',
  'common.openMenu': 'Mở menu',
  'common.print': 'In',
  'common.retry': 'Thử lại',
  'common.update': 'Cập nhật',
  'common.user': 'Người dùng',
  'common.view': 'Xem',
  'customers.contact': 'Thông tin liên hệ',
  'customers.createError': 'Lỗi tạo khách hàng: {message}',
  'customers.createSuccess': 'Đã tạo khách hàng thành công',
  'customers.deleteError': 'Lỗi xóa khách hàng: {message}',
  'customers.deleteSuccess': 'Đã xóa khách hàng thành công',
  'customers.entityName': 'Khách hàng',
  'customers.list.created': 'Ngày tạo',
  'customers.list.email': 'Email',
  'customers.list.name': 'Tên',
  'customers.list.pageDescription': 'Quản lý hồ sơ khách hàng của bạn.',
  'customers.list.pageTitle': 'Danh sách Khách hàng',
  'customers.list.phone': 'Điện thoại',
  'customers.list.searchPlaceholder': 'Tìm khách hàng theo tên hoặc email...',
  'customers.new': 'Khách hàng mới',
  'customers.updateSuccess': 'Đã cập nhật khách hàng thành công',
  'errors.requiredFieldsMissing': 'Vui lòng điền đầy đủ các trường bắt buộc.',
  'nav.customers': 'Khách hàng',
  'nav.dashboard': 'Bảng điều khiển',
  'nav.products': 'Sản phẩm',
  'nav.quotes': 'Báo giá',
  'nav.settings': 'Cài đặt',
  'print.document': 'In Tài liệu',
  'print.printNow': 'In Ngay',
  'productFields.category': 'Danh mục',
  'productFields.description': 'Mô tả',
  'productFields.location': 'Vị trí lưu trữ',
  'productFields.manufacturer': 'Nhà sản xuất',
  'productFields.name': 'Tên Sản phẩm',
  'productFields.notes': 'Ghi chú',
  'productFields.sku': 'SKU / Mã hàng',
  'productFields.supplier': 'Nhà cung cấp',
  'productFields.unit': 'Đơn vị tính',
  'productFields.unitPrice': 'Đơn giá',
  'productPlaceholders.category': 'VD: Điện, Nước',
  'productPlaceholders.description': 'Nhập mô tả sản phẩm...',
  'productPlaceholders.location': 'VD: Kho A, Kệ 3B',
  'productPlaceholders.manufacturer': 'VD: Công ty ABC',
  'productPlaceholders.name': 'Nhập tên sản phẩm...',
  'productPlaceholders.notes': 'Nhập ghi chú về sản phẩm...',
  'productPlaceholders.sku': 'VD: ABC-12345',
  'productPlaceholders.supplier': 'VD: Công ty Cung ứng XYZ',
  'productPlaceholders.unit': 'VD: cái, hộp, mét',
  'products.createModalTitle': 'Tạo Sản phẩm Mới',
  'products.createSuccess': 'Đã tạo sản phẩm thành công',
  'products.deleteError': 'Lỗi xóa sản phẩm: {message}',
  'products.deleteSuccess': 'Đã xóa sản phẩm thành công',
  'products.editModalTitle': 'Sửa Sản phẩm',
  'products.entityName': 'Sản phẩm',
  'products.list.category': 'Danh mục',
  'products.list.name': 'Tên',
  'products.list.pageDescription': 'Quản lý danh mục sản phẩm của bạn.',
  'products.list.price': 'Giá',
  'products.noProductsFound': 'Không tìm thấy sản phẩm nào.',
  'products.searchPlaceholder': 'Tìm kiếm sản phẩm...',
  'products.title': 'Sản phẩm',
  'products.updateSuccess': 'Đã cập nhật sản phẩm thành công',
  'products.viewModalTitle': 'Xem Chi tiết Sản phẩm',
  'quoteSummary.grandTotal': 'Tổng cộng',
  'quoteSummary.markupCalculated': 'Phụ phí',
  'quoteSummary.markupInputLabel': 'Phụ phí %',
  'quoteSummary.subtotalCombined': 'Tổng phụ (Công việc + Vật liệu)',
  'quoteSummary.subtotalMaterials': 'Tổng phụ Vật liệu',
  'quoteSummary.subtotalTasks': 'Tổng phụ Công việc',
  'quoteSummary.title': 'Tóm tắt Báo giá',
  'quotes.deleteError': 'Lỗi xóa báo giá: {message}',
  'quotes.deleteSuccess': 'Đã xóa báo giá thành công',
  'quotes.detailsSectionTitle': 'Chi tiết Báo giá',
  'quotes.entityName': 'Báo giá',
  'quotes.estimatedMaterialCostLumpSumLabel': 'Chi phí Vật liệu Ước tính (Gộp)',
  'quotes.fields.customer': 'Khách hàng',
  'quotes.fields.title': 'Tiêu đề Báo giá',
  'quotes.list.created': 'Ngày tạo',
  'quotes.list.customer': 'Khách hàng',
  'quotes.list.header': 'Báo giá',
  'quotes.list.id': 'ID',
  'quotes.list.status': 'Trạng thái',
  'quotes.list.title': 'Tiêu đề',
  'quotes.list.total': 'Tổng cộng',
  'quotes.materialTypeItemized': 'Chi tiết',
  'quotes.materialTypeLabel': 'Vật liệu',
  'quotes.materialTypeLumpSum': 'Gộp',
  'quotes.materialsSectionTitle': 'Vật liệu',
  'quotes.notesLabel': 'Ghi chú',
  'quotes.placeholders.notes': 'Nhập ghi chú...',
  'quotes.placeholders.selectCustomer': 'Chọn khách hàng...',
  'quotes.placeholders.title': 'Nhập tiêu đề báo giá...',
  'quotes.status.accepted': 'Đã chấp nhận',
  'quotes.status.draft': 'Bản nháp',
  'quotes.status.rejected': 'Đã từ chối',
  'quotes.status.sent': 'Đã gửi',
  'quotes.statusChange.title': 'Thay đổi Trạng thái Báo giá',
  'quotes.statusChange.current': 'Trạng thái Hiện tại',
  'quotes.statusChange.new': 'Trạng thái Mới',
  'quotes.statusChange.submit': 'Cập nhật Trạng thái',
  'quotes.statusChange.cancel': 'Hủy',
  'quotes.statusChange.success': 'Đã cập nhật trạng thái báo giá thành công',
  'quotes.statusChange.error': 'Không thể cập nhật trạng thái báo giá: {message}',
  'quotes.print.customer': 'Thông tin Khách hàng',
  'quotes.print.details': 'Chi tiết Báo giá',
  'quotes.print.laborTotal': 'Tổng Nhân công',
  'quotes.print.materialsTotal': 'Tổng Vật liệu',
  'quotes.print.subtotal': 'Tổng phụ',
  'quotes.print.markup': 'Tăng giá ({percentage}%)',
  'quotes.print.grandTotal': 'Tổng cộng',
  'quotes.print.footerNote': 'Tài liệu này được tạo vào ngày {date} và chỉ dành cho mục đích ước tính.',
  'quotes.print.quoteInformation': 'Thông tin Báo giá',
  'quotes.print.title': 'Tiêu đề:',
  'quotes.print.tasksAndMaterials': 'Công việc & Vật liệu',
  'quotes.print.description': 'Mô tả',
  'quotes.print.labor': 'Nhân công',
  'quotes.print.materials': 'Vật liệu',
  'quotes.print.summary': 'Tổng kết',
  'quotes.print.notes': 'Ghi chú',
  'quotes.print.generatedMessage': 'Tài liệu này được tạo vào ngày {date} và chỉ dành cho mục đích ước tính.',
  'quotes.taskDescriptionLabel': 'Mô tả Công việc',
  'quotes.taskDescriptionPlaceholder': 'Nhập mô tả công việc...',
  'quotes.taskPriceLabel': 'Giá Công việc',
  'quotes.tasksSectionTitle': 'Công việc & Vật liệu',
  'settings.changeTheme': 'Đổi Chủ đề',
  'settings.changeThemeTitle': 'Đổi sang chủ đề {theme}',
  'settings.fetchError': 'Không thể tải cài đặt: {message}',
  'settings.language': 'Ngôn ngữ',
  'settings.loadError': 'Không thể tải cài đặt.',
  'settings.saveError': 'Không thể lưu cài đặt: {message}',
  'settings.saveSuccess': 'Đã lưu cài đặt thành công.',
  'settings.selectLanguage': 'Chọn Ngôn ngữ',
  'settings.title': 'Cài đặt',
  'settings.validationError': 'Vui lòng sửa các lỗi trước khi lưu.',
  'userMenu.profile': 'Hồ sơ',
  'userMenu.settings': 'Cài đặt',
  'userMenu.signOut': 'Đăng xuất',
  'userMenu.title': 'Menu Người dùng',
  'categories.title': 'Danh Mục',
  'categories.list.name': 'Tên',
  'categories.list.description': 'Mô tả',
  'categories.list.productCount': 'Sản phẩm',
  'categories.new': 'Danh Mục Mới',
  'categories.edit': 'Sửa Danh Mục',
  'categories.createSuccess': 'Đã tạo danh mục thành công',
  'categories.createError': 'Lỗi tạo danh mục: {message}',
  'categories.updateSuccess': 'Đã cập nhật danh mục thành công',
  'categories.updateError': 'Lỗi cập nhật danh mục: {message}',
  'categories.deleteSuccess': 'Đã xóa danh mục thành công',
  'categories.entityName': 'Danh mục',
  'categories.noCategories': 'Không tìm thấy danh mục nào.',
  'categories.searchPlaceholder': 'Tìm kiếm danh mục...',
  'breadcrumb.categories.list': 'Danh Mục',
  'breadcrumb.categories.new': 'Danh Mục Mới',
  'breadcrumb.customers.list': 'Khách hàng',
  'breadcrumb.customers.new': 'Khách hàng mới',
  'breadcrumb.edit': 'Sửa',
  'breadcrumb.products.list': 'Sản phẩm',
  'breadcrumb.products.new': 'Sản phẩm mới',
  'breadcrumb.quotes.list': 'Báo giá',
  'breadcrumb.quotes.new': 'Báo giá mới',
  'breadcrumb.settings': 'Cài đặt',
  'common.createdAt': 'Ngày tạo',
  'common.notSpecified': 'Không xác định',
  'common.save': 'Lưu',
  'common.updatedAt': 'Cập nhật lúc',
  'customers.edit.pageTitle': 'Sửa Khách hàng',
  'customers.list.address': 'Địa chỉ',
  'customers.list.notes': 'Ghi chú',
  'dashboard.overview.liveData': 'Dữ liệu trực tiếp',
  'dashboard.overview.title': 'Tổng Quan',
  'dashboard.quickActions.addCustomer': 'Thêm Khách Hàng',
  'dashboard.quickActions.addProduct': 'Thêm Sản Phẩm',
  'dashboard.quickActions.createQuote': 'Tạo Báo Giá',
  'dashboard.quickActions.title': 'Thao Tác Nhanh',
  'dashboard.recentQuotes.acceptedCount': 'báo giá đã chấp nhận',
  'dashboard.recentQuotes.conversionRate': 'tỷ lệ chuyển đổi',
  'dashboard.recentQuotes.newQuote': 'Báo Giá Mới',
  'dashboard.recentQuotes.noQuotes': 'Không có báo giá gần đây.',
  'dashboard.recentQuotes.revenueInfo': 'doanh thu từ {count} báo giá',
  'dashboard.recentQuotes.title': 'Báo Giá Gần Đây',
  'dashboard.recentQuotes.viewAll': 'Xem tất cả',
  'dashboard.stats.productsUsed': 'Sản Phẩm Đã Dùng',
  'dashboard.stats.productsUsed.subtitle': 'trong báo giá đang hoạt động',
  'dashboard.stats.revenue': 'Doanh Thu',
  'dashboard.stats.revenue.subtitle': 'từ báo giá đã chấp nhận',
  'dashboard.stats.timeframe.lastQuarter': 'so với quý trước',
  'dashboard.stats.timeframe.thisMonth': 'tháng này',
  'dashboard.stats.timeframe.vsTarget': 'so với mục tiêu',
  'dashboard.stats.totalCustomers': 'Tổng Khách Hàng',
  'dashboard.stats.totalCustomers.subtitle': 'tài khoản đang hoạt động',
  'dashboard.stats.totalQuotes': 'Tổng Báo Giá',
  'dashboard.stats.totalQuotes.subtitle': 'trên tất cả khách hàng',
  'dashboard.title': 'Bảng Điều Khiển',
  'dashboard.welcome': 'Chào mừng trở lại! Đây là tổng quan về hoạt động kinh doanh của bạn.',
  'products.edit.pageTitle': 'Sửa Sản phẩm',
  'products.form.category': 'Danh mục',
  'products.form.description': 'Mô tả',
  'products.form.location': 'Vị trí',
  'products.form.manufacturer': 'Nhà sản xuất',
  'products.form.name': 'Tên',
  'products.form.notes': 'Ghi chú',
  'products.form.price': 'Giá',
  'products.form.selectCategory': 'Chọn Danh Mục',
  'products.form.sku': 'SKU',
  'products.form.supplier': 'Nhà cung cấp',
  'products.form.unit': 'Đơn vị tính',
  'products.formTitle': 'Form Sản phẩm',
  'products.list.description': 'Mô tả',
  'products.list.header': 'Danh sách Sản phẩm',
  'products.list.location': 'Vị trí',
  'products.list.manufacturer': 'Nhà sản xuất',
  'products.list.notes': 'Ghi chú',
  'products.list.sku': 'SKU',
  'products.list.supplier': 'Nhà cung cấp',
  'products.list.unit': 'Đơn vị tính',
  'products.new.pageTitle': 'Tạo Sản phẩm Mới',
  'quotes.list.searchPlaceholder': 'Tìm kiếm báo giá...',
  'quotes.new.pageTitle': 'Tạo Báo giá Mới',
  'quotes.title': 'Báo giá',
  'settings.pageTitle': 'Cài đặt',
  'categories.edit.pageTitle': 'Sửa Danh Mục',
  
  // Company settings
  'settings.company.title': 'Thông tin công ty',
  'settings.company.name': 'Tên công ty',
  'settings.company.email': 'Email công ty',
  'settings.company.phone': 'Số điện thoại',
  'settings.company.address': 'Địa chỉ',
  'settings.company.taxId': 'Mã số thuế',
  'settings.company.logo': 'Logo công ty',
  'settings.company.website': 'Trang web',
  
  // Profile settings
  'settings.profile.title': 'Hồ sơ',
  'settings.profile.name': 'Tên',
  'settings.profile.email': 'Email',
  'settings.profile.phone': 'Điện thoại',
  'settings.profile.position': 'Chức vụ',
  'settings.profile.language': 'Ngôn ngữ ưa thích',
  
  // Appearance settings
  'settings.appearance.title': 'Giao diện',
  'settings.appearance.theme': 'Chủ đề',
  'settings.appearance.density': 'Mật độ hiển thị',
  'settings.appearance.density.compact': 'Gọn gàng',
  'settings.appearance.density.comfortable': 'Thoải mái',
  
  // Notification settings
  'settings.notifications.title': 'Thông báo',
  'settings.notifications.email': 'Thông báo qua Email',
  'settings.notifications.app': 'Thông báo ứng dụng',
  'settings.notifications.quotes': 'Cập nhật Báo giá',
  'settings.notifications.customers': 'Cập nhật Khách hàng',
  
  // Default settings
  'settings.defaults.title': 'Mặc định',
  'settings.defaults.currency': 'Tiền tệ',
  'settings.defaults.taxRate': 'Thuế suất',
  'settings.defaults.quoteExpiry': 'Thời hạn Báo giá (ngày)',
  'settings.defaults.terms': 'Điều khoản & Điều kiện mặc định',
  
  // Security settings
  'settings.security.title': 'Bảo mật',
  'settings.security.changePassword': 'Đổi Mật khẩu',
  'settings.security.twoFactor': 'Xác thực Hai yếu tố',
  'settings.security.sessions': 'Phiên đang hoạt động',
  'settings.security.apiKeys': 'Khóa API',
  
  // Action buttons
  'settings.actions.save': 'Lưu thay đổi',
  'settings.actions.cancel': 'Hủy',
  'settings.actions.reset': 'Đặt lại về mặc định',
  'settings.actions.upload': 'Tải lên',
  'settings.actions.remove': 'Xóa',
  
  // Localization settings
  'settings.localization.title': 'Bản địa hóa',
  'settings.localization.description': 'Cấu hình ngôn ngữ và cài đặt khu vực',
  
  // Quote view page translations
  'quotes.view.title': 'Chi tiết Báo giá',
  'quotes.view.backToQuotes': 'Quay lại Báo giá',
  'quotes.view.changeStatus': 'Thay đổi Trạng thái',
  'quotes.view.notFound': 'Không tìm thấy báo giá',
  'quotes.view.customerInfo': 'Thông tin Khách hàng',
  'quotes.view.quoteInfo': 'Chi tiết Báo giá',
  'quotes.view.createdOn': 'Ngày tạo:',
  'quotes.view.lastUpdated': 'Cập nhật lần cuối:',
  'quotes.view.markup': 'Tăng giá:',
  'quotes.view.subtotal': 'Tổng phụ:',
  'quotes.view.grandTotal': 'Tổng cộng:',
  'quotes.view.costBreakdown': 'Phân tích Chi phí',
  'quotes.view.labor': 'Nhân công',
  'quotes.view.materials': 'Vật liệu',
  'quotes.view.percentOfTotal': '% của tổng',
  'quotes.view.notes': 'Ghi chú',
  'quotes.view.tasks': 'Công việc',
  'quotes.view.noTasks': 'Không có công việc nào được thêm vào báo giá này',
  'quotes.view.taskDetails': 'Chi tiết Công việc',
  'quotes.view.costDistribution': 'Phân bổ Chi phí',
  'quotes.view.item': 'Mục',
  'quotes.view.quantity': 'SL',
  'quotes.view.unitPrice': 'Đơn giá',
  'quotes.view.total': 'Tổng',
  'quotes.view.lumpSum': 'Tổng gộp',
  'quotes.view.itemized': 'Chi tiết',
  'quotes.view.materialsLumpSum': 'Vật liệu (Tổng gộp)',
  'quotes.summary.markupCalculated': 'Tính toán tăng giá',
};

export default viTranslations;
