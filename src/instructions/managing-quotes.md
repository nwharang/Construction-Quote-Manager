# Managing Quotes

The core function of the application is creating and managing quotes.

## Quote List (`/admin/quotes`)

*   This is where you see all your quotes.
*   You can **Search** for quotes by title.
*   Use the **Table/Card View** toggle to change the layout.
*   Click **Create Quote** to start a new quote.
*   Click on a quote row/card or the **View** icon to see its details.
*   Click the **Edit** icon (pencil) to modify a quote.
*   Click the **Delete** icon (trash can) to remove a quote (confirmation required).

## Creating a Quote (`/admin/quotes/new`)

1.  **Title:** Give your quote a descriptive title.
2.  **Customer:** Select an existing customer from the dropdown. If the customer doesn't exist, you'll need to create them first via the Customers section.
3.  **Markup %:** Enter the desired markup percentage for this quote (overrides the default setting).
4.  **Notes:** Add any internal notes for this quote.
5.  **Tasks & Materials:** Click **Add Task** to start adding line items (see below).
6.  Click **Save Quote**.

## Editing a Quote (`/admin/quotes/[id]/edit`)

This page is similar to creating a quote, but allows you to modify existing details, tasks, and materials.

### Tasks & Materials

Quotes are built from Tasks (representing labor or specific work items) and optionally associated Materials.

*   **Adding a Task:** Click **Add Task**. A drawer/panel will open.
    *   Enter the **Task Description** (e.g., "Install Light Fixture", "Paint Wall").
    *   Enter the **Task Price** (labor cost for this task).
    *   Choose **Material Type**:
        *   **Lump Sum:** Enter a single estimated cost for all materials related to this task.
        *   **Itemized:** Add specific materials one by one.
*   **Adding Itemized Materials:**
    *   If Material Type is "Itemized", click **Add Material**.
    *   **Select Product:** Choose a product from your catalog using the dropdown search.
The Unit Price will populate automatically.
    *   **Quantity:** Enter the quantity needed for this material.
    *   **Notes:** Add optional notes specific to this material line item.
    *   Repeat to add more materials to the task.
*   **Saving Tasks:** Click **Save** or **Done** in the task drawer/panel to add it to the quote.
*   **Editing/Deleting Tasks:** Use the controls in the task list on the main edit page.

Click **Update Quote** to save all changes.

## Viewing a Quote (`/admin/quotes/[id]/view`)

*   Shows a summary of the quote details, customer information, tasks, materials, and calculated totals.
*   You can change the quote's **Status** (e.g., Draft, Sent, Accepted) using the dropdown/button.
*   Use the **Print**, **Edit**, and **Delete** buttons for further actions.

## Printing a Quote (`/admin/quotes/[id]/print`)

*   Shows a printable preview of the quote.
*   Use the **Print Settings** button (gear icon) to adjust options before printing:
    *   **Toggle Markup Details:** Choose whether to show the markup as a separate line item or distribute it into the task/material prices.
    *   **Toggle Signature Section:** Show or hide signature lines at the bottom.
    *   **Toggle Separate Prices:** Show labor and material costs in separate columns or combined into one total column per task.
    *   **Toggle Print Date:** Show or hide the date the quote was printed.
    *   **Signer Name:** Optionally enter a name to appear on the signature line.
*   Use your browser's print function (Ctrl+P or Cmd+P) to print the quote. 