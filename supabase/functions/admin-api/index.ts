import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

// ============================================================
// Handler functions
// ============================================================

async function handleDashboardKpi(sb: SupabaseClient) {
  const activeStatuses = ["paid", "pending", "open", "assigned", "in_progress"];

  const [ordersRes, disputesRes, withdrawalsRes, bannedRes, todayOrdersRes] =
    await Promise.all([
      sb
        .from("orders")
        .select("id,status,price")
        .in("status", activeStatuses),
      sb
        .from("disputes")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
      sb
        .from("withdrawals")
        .select("id,amount")
        .eq("type", "withdrawal")
        .eq("status", "pending"),
      sb
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_banned", true),
      sb
        .from("orders")
        .select("id,price,status")
        .gte("created_at", new Date().toISOString().slice(0, 10)),
    ]);

  return {
    active_orders: ordersRes.data ?? [],
    open_disputes_count: disputesRes.count ?? 0,
    pending_withdrawals: withdrawalsRes.data ?? [],
    banned_users_count: bannedRes.count ?? 0,
    today_orders: todayOrdersRes.data ?? [],
  };
}

async function handleListUsers(sb: SupabaseClient) {
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function handleListOrders(sb: SupabaseClient) {
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function handleListWithdrawals(sb: SupabaseClient) {
  const [withdrawalsRes, employeesRes] = await Promise.all([
    sb
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    sb
      .from("profiles")
      .select("id,username,full_name,balance,role,bank_account_info")
      .in("role", ["employee", "worker", "admin"]),
  ]);
  if (withdrawalsRes.error) throw new Error(withdrawalsRes.error.message);
  if (employeesRes.error) throw new Error(employeesRes.error.message);
  return {
    withdrawals: withdrawalsRes.data,
    employees: employeesRes.data,
  };
}

async function handleListSecurity(sb: SupabaseClient) {
  const [bannedRes, warnedRes] = await Promise.all([
    sb.from("profiles").select("*").eq("is_banned", true),
    sb.from("profiles").select("*").gt("warning_count", 0).eq("is_banned", false),
  ]);
  if (bannedRes.error) throw new Error(bannedRes.error.message);
  if (warnedRes.error) throw new Error(warnedRes.error.message);
  return {
    banned: bannedRes.data,
    warned: warnedRes.data,
  };
}

async function handleGetMetrics(sb: SupabaseClient) {
  const [ordersRes, profilesRes, disputesRes] = await Promise.all([
    sb.from("orders").select("id,status,price,created_at"),
    sb.from("profiles").select("id,role,is_banned"),
    sb.from("disputes").select("id,status"),
  ]);
  if (ordersRes.error) throw new Error(ordersRes.error.message);
  if (profilesRes.error) throw new Error(profilesRes.error.message);
  if (disputesRes.error) throw new Error(disputesRes.error.message);
  return {
    orders: ordersRes.data,
    profiles: profilesRes.data,
    disputes: disputesRes.data,
  };
}

async function handleListNotifications(
  sb: SupabaseClient,
  params: { limit?: number; userIds?: string[] }
) {
  const limit = params.limit ?? 500;

  const { data: notifications, error } = await sb
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  let profiles = null;
  if (params.userIds && params.userIds.length > 0) {
    const { data, error: pErr } = await sb
      .from("profiles")
      .select("id,username,full_name,role")
      .in("id", params.userIds);
    if (pErr) throw new Error(pErr.message);
    profiles = data;
  }

  return { notifications, profiles };
}

async function handleListChatThreads(sb: SupabaseClient) {
  const { data, error } = await sb
    .from("chat_threads")
    .select("*, order:orders(id,current_rank,target_rank,game_title,status)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function handleListViolations(
  sb: SupabaseClient,
  params: { userIds?: string[] }
) {
  const { data: violations, error } = await sb
    .from("chat_violations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);

  let profiles = null;
  if (params.userIds && params.userIds.length > 0) {
    const { data, error: pErr } = await sb
      .from("profiles")
      .select("id,username,full_name")
      .in("id", params.userIds);
    if (pErr) throw new Error(pErr.message);
    profiles = data;
  }

  return { violations, profiles };
}

async function handleListDisputes(sb: SupabaseClient) {
  const { data, error } = await sb
    .from("disputes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

async function handleGetDisputeDetail(
  sb: SupabaseClient,
  params: { order_id: string }
) {
  if (!params.order_id) throw new Error("order_id が必要です");

  const [orderRes, threadRes] = await Promise.all([
    sb
      .from("orders")
      .select(
        "id,price,total_price,payment_intent_id,employee_id,user_id,is_refunded,is_paid_out"
      )
      .eq("id", params.order_id)
      .single(),
    sb
      .from("chat_threads")
      .select("id")
      .eq("order_id", params.order_id)
      .maybeSingle(),
  ]);
  if (orderRes.error) throw new Error(orderRes.error.message);
  return {
    order: orderRes.data,
    chat_thread_id: threadRes.data?.id ?? null,
  };
}

async function handleListDisputeMessages(
  sb: SupabaseClient,
  params: { dispute_id: string }
) {
  if (!params.dispute_id) throw new Error("dispute_id が必要です");

  const { data, error } = await sb
    .from("dispute_messages")
    .select("*")
    .eq("dispute_id", params.dispute_id)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

async function handleListLogs(sb: SupabaseClient) {
  const { data, error } = await sb
    .from("admin_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return data;
}

async function handleListRatings(sb: SupabaseClient) {
  const { data, error } = await sb
    .from("ratings")
    .select("employee_id, score, employee:profiles!ratings_employee_id_fkey(id,username,full_name)");
  if (error) throw new Error(error.message);
  return data;
}

async function handleGetRatingDetail(
  sb: SupabaseClient,
  params: { employee_id: string }
) {
  if (!params.employee_id) throw new Error("employee_id が必要です");

  const { data, error } = await sb
    .from("ratings")
    .select("id,score,comment,created_at,user_id")
    .eq("employee_id", params.employee_id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data;
}

async function handleGetReports(
  sb: SupabaseClient,
  params: { from_date: string; to_date: string }
) {
  if (!params.from_date || !params.to_date)
    throw new Error("from_date と to_date が必要です");

  const [ordersRes, withdrawalsRes, feeRateRes] = await Promise.all([
    sb
      .from("orders")
      .select("*")
      .gte("created_at", params.from_date)
      .lte("created_at", params.to_date + "T23:59:59.999Z"),
    sb
      .from("withdrawals")
      .select("id,user_id,amount,type,status,created_at,description")
      .gte("created_at", params.from_date)
      .lte("created_at", params.to_date + "T23:59:59.999Z"),
    sb
      .from("system_settings")
      .select("value")
      .eq("key", "platform_fee_rate")
      .single(),
  ]);
  if (ordersRes.error) throw new Error(ordersRes.error.message);
  if (withdrawalsRes.error) throw new Error(withdrawalsRes.error.message);

  return {
    orders: ordersRes.data,
    withdrawals: withdrawalsRes.data,
    platform_fee_rate: feeRateRes.data?.value ?? null,
  };
}

async function handleGetBroadcastTargets(
  sb: SupabaseClient,
  params: { role?: string }
) {
  let query = sb
    .from("profiles")
    .select("id")
    .eq("is_banned", false);

  if (params.role) {
    query = query.eq("role", params.role);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

async function handleGetBroadcastNotifications(
  sb: SupabaseClient,
  params: { title: string; limit?: number }
) {
  if (!params.title) throw new Error("title が必要です");
  const limit = params.limit ?? 500;

  const { data, error } = await sb
    .from("notifications")
    .select("*")
    .eq("type", "admin_broadcast")
    .eq("title", params.title)
    .is("email_sent_at", null)
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

async function handleGetProfilesByIds(
  sb: SupabaseClient,
  params: { ids: string[] }
) {
  if (!params.ids || params.ids.length === 0)
    throw new Error("ids が必要です");

  const { data, error } = await sb
    .from("profiles")
    .select("id,username,full_name,role")
    .in("id", params.ids);
  if (error) throw new Error(error.message);
  return data;
}

// ============================================================
// WRITE actions
// ============================================================

async function handleWarnUser(
  sb: SupabaseClient,
  params: { user_id: string; reason: string }
) {
  if (!params.user_id) throw new Error("user_id が必要です");

  // Get current warning_count
  const { data: profile, error: fetchErr } = await sb
    .from("profiles")
    .select("warning_count")
    .eq("id", params.user_id)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const newCount = (profile?.warning_count ?? 0) + 1;

  // If warning_count reaches 2, auto-ban
  const updatePayload: Record<string, unknown> = {
    warning_count: newCount,
  };
  if (newCount >= 2) {
    updatePayload.is_banned = true;
    updatePayload.ban_reason = params.reason || "警告回数超過による自動BAN";
    updatePayload.banned_at = new Date().toISOString();
  }

  const { data, error } = await sb
    .from("profiles")
    .update(updatePayload)
    .eq("id", params.user_id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function handleBanUser(
  sb: SupabaseClient,
  params: { user_id: string; ban_reason: string }
) {
  if (!params.user_id) throw new Error("user_id が必要です");

  const { data, error } = await sb
    .from("profiles")
    .update({
      is_banned: true,
      ban_reason: params.ban_reason || null,
      banned_at: new Date().toISOString(),
    })
    .eq("id", params.user_id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function handleUnbanUser(
  sb: SupabaseClient,
  params: { user_id: string }
) {
  if (!params.user_id) throw new Error("user_id が必要です");

  const { data, error } = await sb
    .from("profiles")
    .update({
      is_banned: false,
      ban_reason: null,
      banned_at: null,
    })
    .eq("id", params.user_id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function handleResetWarnings(
  sb: SupabaseClient,
  params: { user_id: string }
) {
  if (!params.user_id) throw new Error("user_id が必要です");

  const { data, error } = await sb
    .from("profiles")
    .update({ warning_count: 0 })
    .eq("id", params.user_id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

const ALLOWED_ROLES = ["customer", "employee", "worker", "admin"];

async function handleChangeRole(
  sb: SupabaseClient,
  params: { user_id: string; new_role: string }
) {
  if (!params.user_id || !params.new_role)
    throw new Error("user_id と new_role が必要です");
  if (!ALLOWED_ROLES.includes(params.new_role))
    throw new Error(`無効なロールです: ${params.new_role}`);

  const { data, error } = await sb
    .from("profiles")
    .update({ role: params.new_role })
    .eq("id", params.user_id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function handleAdjustBalance(
  sb: SupabaseClient,
  params: {
    user_id: string;
    new_balance: number;
    description: string;
    amount: number;
    type: string;
  }
) {
  if (!params.user_id) throw new Error("user_id が必要です");
  if (params.new_balance == null) throw new Error("new_balance が必要です");
  if (params.new_balance < 0) throw new Error("new_balance は0以上である必要があります");
  if (!params.description || typeof params.description !== "string" || params.description.trim() === "") {
    throw new Error("reason（description）が必要です");
  }

  // 変更前の残高を取得（監査ログ用）
  const { data: oldProfile, error: fetchErr } = await sb
    .from("profiles")
    .select("balance")
    .eq("id", params.user_id)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);
  const oldBalance = oldProfile?.balance ?? 0;

  const { data: profile, error: updateErr } = await sb
    .from("profiles")
    .update({ balance: params.new_balance })
    .eq("id", params.user_id)
    .select()
    .single();
  if (updateErr) throw new Error(updateErr.message);

  console.log("Balance adjusted:", { user_id: params.user_id, old_balance: oldBalance, new_balance: params.new_balance, reason: params.description });

  const { error: insertErr } = await sb.from("withdrawals").insert({
    user_id: params.user_id,
    amount: params.amount,
    type: params.type || "withdrawal",
    status: "completed",
    description: params.description || "管理者による残高調整",
  });
  if (insertErr) throw new Error(insertErr.message);

  return profile;
}

const ALLOWED_ORDER_STATUSES = [
  "pending", "open", "paid", "assigned", "in_progress",
  "completed", "confirmed", "cancelled",
];

async function handleChangeOrderStatus(
  sb: SupabaseClient,
  params: { order_id: string; new_status: string }
) {
  if (!params.order_id || !params.new_status)
    throw new Error("order_id と new_status が必要です");
  if (!ALLOWED_ORDER_STATUSES.includes(params.new_status))
    throw new Error(`無効なステータスです: ${params.new_status}`);

  const { data, error } = await sb
    .from("orders")
    .update({ status: params.new_status })
    .eq("id", params.order_id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function handleForceCompleteOrder(
  sb: SupabaseClient,
  params: { order_id: string }
) {
  if (!params.order_id) throw new Error("order_id が必要です");

  const { data, error } = await sb
    .from("orders")
    .update({
      status: "confirmed",
      is_paid_out: true,
      paid_out_at: new Date().toISOString(),
    })
    .eq("id", params.order_id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

const ALLOWED_SETTING_KEYS = [
  "platform_fee_rate",
  "auto_cancel_hours",
  "maintenance_mode",
  "ng_words",
];

async function handleUpdateSystemSetting(
  sb: SupabaseClient,
  params: { key: string; value: string },
  adminUserId: string
) {
  if (!params.key) throw new Error("key が必要です");
  if (!ALLOWED_SETTING_KEYS.includes(params.key))
    throw new Error(`変更できない設定キーです: ${params.key}`);

  const { data, error } = await sb
    .from("system_settings")
    .upsert(
      {
        key: params.key,
        value: params.value,
        updated_at: new Date().toISOString(),
        updated_by: adminUserId,
      },
      { onConflict: "key" }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ============================================================
// Expense CRUD
// ============================================================

async function handleListExpenses(
  sb: SupabaseClient,
  params: { from_date?: string; to_date?: string }
) {
  let query = sb
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false });

  if (params.from_date) query = query.gte("expense_date", params.from_date);
  if (params.to_date) query = query.lte("expense_date", params.to_date);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

async function handleCreateExpense(
  sb: SupabaseClient,
  params: {
    category: string;
    description: string;
    amount: number;
    expense_date: string;
    receipt_url?: string;
  },
  adminUserId: string
) {
  if (!params.category || !params.description || !params.amount || !params.expense_date)
    throw new Error("category, description, amount, expense_date が必要です");

  const { data, error } = await sb
    .from("expenses")
    .insert({
      category: params.category,
      description: params.description,
      amount: params.amount,
      expense_date: params.expense_date,
      receipt_url: params.receipt_url || null,
      created_by: adminUserId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function handleUpdateExpense(
  sb: SupabaseClient,
  params: {
    id: string;
    category?: string;
    description?: string;
    amount?: number;
    expense_date?: string;
    receipt_url?: string;
  }
) {
  if (!params.id) throw new Error("id が必要です");

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.category !== undefined) updates.category = params.category;
  if (params.description !== undefined) updates.description = params.description;
  if (params.amount !== undefined) updates.amount = params.amount;
  if (params.expense_date !== undefined) updates.expense_date = params.expense_date;
  if (params.receipt_url !== undefined) updates.receipt_url = params.receipt_url;

  const { data, error } = await sb
    .from("expenses")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function handleDeleteExpense(
  sb: SupabaseClient,
  params: { id: string }
) {
  if (!params.id) throw new Error("id が必要です");

  const { error } = await sb.from("expenses").delete().eq("id", params.id);
  if (error) throw new Error(error.message);
  return { deleted: true };
}

// ============================================================
// Stripe 決済手数料取得
// ============================================================

async function handleGetStripeFees(
  params: { from_date: string; to_date: string }
) {
  if (!params.from_date || !params.to_date)
    throw new Error("from_date と to_date が必要です");

  // DB上の注文データから決済手数料を概算（UnivaPayの実手数料はUnivaPay管理画面で確認）
  // platform_fee は自社の手数料。決済手数料は売上 × 決済手数料率（通常3.6%程度）で概算
  const PAYMENT_FEE_RATE = 0.036; // UnivaPay決済手数料率（契約により異なる）

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: orders, error } = await sb
    .from("orders")
    .select("price, created_at")
    .gte("created_at", params.from_date)
    .lte("created_at", params.to_date + "T23:59:59Z")
    .in("status", ["paid", "assigned", "in_progress", "completed", "confirmed"]);

  if (error) throw new Error(error.message);

  let totalFees = 0;
  let totalGross = 0;
  let transactionCount = 0;
  const monthlyFees: Record<string, { fees: number; gross: number; net: number; count: number }> = {};

  for (const order of orders || []) {
    const gross = order.price || 0;
    const fee = Math.round(gross * PAYMENT_FEE_RATE);
    const net = gross - fee;

    totalFees += fee;
    totalGross += gross;
    transactionCount++;

    const d = new Date(order.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyFees[key]) monthlyFees[key] = { fees: 0, gross: 0, net: 0, count: 0 };
    monthlyFees[key].fees += fee;
    monthlyFees[key].gross += gross;
    monthlyFees[key].net += net;
    monthlyFees[key].count++;
  }

  return {
    total_fees: totalFees,
    total_gross: totalGross,
    total_net: totalGross - totalFees,
    transaction_count: transactionCount,
    monthly: monthlyFees,
  };
}

// ============================================================
// Main server
// ============================================================

serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;
  const corsHeaders = getCorsHeaders(req);

  try {
    // ---- Content-Type validation (CSRF protection) ----
    const contentType = req.headers.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({ success: false, error: "Content-Type: application/json が必要です" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 415 }
      );
    }

    // ---- Request size validation ----
    const contentLength = req.headers.get("Content-Length");
    if (contentLength && parseInt(contentLength, 10) > 1_048_576) {
      return new Response(
        JSON.stringify({ success: false, error: "リクエストサイズが大きすぎます" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 413 }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ---- Auth check ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("認証が必要です");
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (!user) throw new Error("認証が必要です");

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role, is_banned")
      .eq("id", user.id)
      .single();
    if (adminProfile?.is_banned) throw new Error("アカウントが停止されています");
    if (adminProfile?.role !== "admin") throw new Error("管理者権限が必要です");

    // ---- Parse body & route ----
    const body = await req.json();
    const { action, ...params } = body;

    let result: unknown;

    switch (action) {
      // READ
      case "dashboard-kpi":
        result = await handleDashboardKpi(supabase);
        break;
      case "list-users":
        result = await handleListUsers(supabase);
        break;
      case "list-orders":
        result = await handleListOrders(supabase);
        break;
      case "list-withdrawals":
        result = await handleListWithdrawals(supabase);
        break;
      case "list-security":
        result = await handleListSecurity(supabase);
        break;
      case "get-metrics":
        result = await handleGetMetrics(supabase);
        break;
      case "list-notifications":
        result = await handleListNotifications(supabase, params);
        break;
      case "list-chat-threads":
        result = await handleListChatThreads(supabase);
        break;
      case "list-violations":
        result = await handleListViolations(supabase, params);
        break;
      case "list-disputes":
        result = await handleListDisputes(supabase);
        break;
      case "get-dispute-detail":
        result = await handleGetDisputeDetail(supabase, params);
        break;
      case "list-dispute-messages":
        result = await handleListDisputeMessages(supabase, params);
        break;
      case "list-logs":
        result = await handleListLogs(supabase);
        break;
      case "list-ratings":
        result = await handleListRatings(supabase);
        break;
      case "get-rating-detail":
        result = await handleGetRatingDetail(supabase, params);
        break;
      case "get-reports":
        result = await handleGetReports(supabase, params);
        break;
      case "get-broadcast-targets":
        result = await handleGetBroadcastTargets(supabase, params);
        break;
      case "get-broadcast-notifications":
        result = await handleGetBroadcastNotifications(supabase, params);
        break;
      case "get-profiles-by-ids":
        result = await handleGetProfilesByIds(supabase, params);
        break;

      // WRITE
      case "warn-user":
        result = await handleWarnUser(supabase, params);
        break;
      case "ban-user":
        result = await handleBanUser(supabase, params);
        break;
      case "unban-user":
        result = await handleUnbanUser(supabase, params);
        break;
      case "reset-warnings":
        result = await handleResetWarnings(supabase, params);
        break;
      case "change-role":
        result = await handleChangeRole(supabase, params);
        break;
      case "adjust-balance":
        result = await handleAdjustBalance(supabase, params);
        break;
      case "change-order-status":
        result = await handleChangeOrderStatus(supabase, params);
        break;
      case "force-complete-order":
        result = await handleForceCompleteOrder(supabase, params);
        break;
      case "update-system-setting":
        result = await handleUpdateSystemSetting(supabase, params, user.id);
        break;

      // EXPENSES
      case "list-expenses":
        result = await handleListExpenses(supabase, params);
        break;
      case "create-expense":
        result = await handleCreateExpense(supabase, params, user.id);
        break;
      case "update-expense":
        result = await handleUpdateExpense(supabase, params);
        break;
      case "delete-expense":
        result = await handleDeleteExpense(supabase, params);
        break;

      // STRIPE FEES
      case "get-stripe-fees":
        result = await handleGetStripeFees(params);
        break;

      default:
        throw new Error(`不明なアクション: ${action}`);
    }

    // ---- Audit log for WRITE actions ----
    const WRITE_ACTIONS = [
      "warn-user", "ban-user", "unban-user", "reset-warnings",
      "change-role", "adjust-balance", "change-order-status",
      "force-complete-order", "update-system-setting",
      "create-expense", "update-expense", "delete-expense",
    ];
    const SENSITIVE_ACTIONS = [
      "adjust-balance", "change-role", "ban-user", "unban-user",
      "force-complete-order", "approve-withdrawal",
    ];
    if (WRITE_ACTIONS.includes(action)) {
      // 機密データをマスクしてからログに記録
      const SENSITIVE_KEYS = ["password", "secret", "token", "stripe_account_id", "credentials", "api_key"];
      const sanitizedParams = Object.fromEntries(
        Object.entries(params || {}).map(([k, v]) =>
          SENSITIVE_KEYS.some(sk => k.toLowerCase().includes(sk))
            ? [k, "***MASKED***"]
            : [k, v]
        )
      );
      const { error: logErr } = await supabase.from("admin_logs").insert({
        actor_user_id: user.id,
        action,
        target_type: action,
        meta_json: sanitizedParams,
      });
      if (logErr) {
        console.error("Audit log failed:", logErr.message);
        if (SENSITIVE_ACTIONS.includes(action)) {
          throw new Error("監査ログの記録に失敗したため、操作を中止しました");
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    console.error("admin-api error:", message);
    // クライアントには安全なエラーメッセージのみ返す（認証・バリデーション系はそのまま）
    const safeMessages = [
      "認証が必要です", "アカウントが停止されています", "管理者権限が必要です",
      "user_id が必要です", "new_balance が必要です", "new_balance は0以上である必要があります",
      "reason（description）が必要です", "order_id が必要です", "order_id と new_status が必要です",
      "user_id と new_role が必要です", "employee_id が必要です", "ids が必要です",
      "dispute_id が必要です", "order_id が必要です", "from_date と to_date が必要です",
      "key が必要です", "title が必要です", "監査ログの記録に失敗したため、操作を中止しました",
      "category, description, amount, expense_date が必要です", "id が必要です",
      "リクエストサイズが大きすぎます",
    ];
    const isSafe = safeMessages.some(m => message.includes(m)) ||
      message.startsWith("無効なロールです") ||
      message.startsWith("変更できない設定キーです") ||
      message.startsWith("不明なアクション");
    return new Response(
      JSON.stringify({ success: false, error: isSafe ? message : "処理中にエラーが発生しました" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
