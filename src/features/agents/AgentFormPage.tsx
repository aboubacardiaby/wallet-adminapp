import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { Save, Send } from "lucide-react";
import { normalizeApiError } from "../../api/errors";
import { formatMoney } from "../../utils/money";
import { geographyApi } from "../geography/api";
import { agentApi } from "./api";
import { agentSchema, type AgentInput } from "./schemas";

const steps = [
  "Business information",
  "Location & contact",
  "Owners",
  "Services & limits",
  "Bank / settlement",
  "Documents",
  "Review & submit",
];

const stepFields: Array<string | string[]> = [
  ["legalBusinessName", "registrationNumber"],
  ["countryId", "cityId", "addressLine1", "contactName", "contactEmail", "contactPhone"],
  "owners",
  ["supportedServices", "dailyPayoutLimit", "maximumCashExposure", "minimumLiquidityThreshold"],
  "bank",
  "documents",
  [],
];

const emptyValues: AgentInput = {
  legalBusinessName: "",
  tradingName: "",
  registrationNumber: "",
  taxIdentificationNumber: "",
  countryId: "",
  regionId: "",
  cityId: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  latitude: undefined,
  longitude: undefined,
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  supportedServices: [],
  dailyPayoutLimit: "",
  maximumCashExposure: "",
  minimumLiquidityThreshold: "",
  commissionPlanId: "",
  riskRating: undefined,
  owners: [],
  documents: [],
  bank: { accountName: "", accountNumber: "", bankName: "", currencyCode: "", isPrimary: true },
};

const documentTypes = [
  "Business registration",
  "Tax certificate",
  "Owner identification",
  "Beneficial-owner declaration",
  "Proof of address",
  "Bank confirmation",
  "Regulatory authorization",
  "Signed agent agreement",
  "Outlet photograph",
];

export function AgentFormPage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [step, setStep] = useState(0);
  const [submitAction, setSubmitAction] = useState<"DRAFT" | "SUBMITTED">("DRAFT");

  const [defaultValues] = useState(() => {
    try {
      const saved = localStorage.getItem("agent-draft");
      return saved ? { ...emptyValues, ...JSON.parse(saved) } : emptyValues;
    } catch {
      return emptyValues;
    }
  });

  const { control, handleSubmit, trigger } = useForm<AgentInput>({
    resolver: zodResolver(agentSchema),
    defaultValues,
    mode: "onChange",
  });

  const values = (useWatch<AgentInput>({ control }) ?? emptyValues) as AgentInput;
  useEffect(() => {
    localStorage.setItem("agent-draft", JSON.stringify(values));
  }, [values]);

  const countryId = useWatch({ control, name: "countryId" }) as string;
  const countries = useQuery({ queryKey: ["countries"], queryFn: () => geographyApi.countries() });
  const regions = useQuery({
    queryKey: ["regions", countryId],
    queryFn: () => geographyApi.regions(countryId),
    enabled: Boolean(countryId),
  });
  const cities = useQuery({
    queryKey: ["cities", countryId],
    queryFn: () => geographyApi.cities({ countryId }),
    enabled: Boolean(countryId),
  });

  const {
    fields: ownerFields,
    append: appendOwner,
    remove: removeOwner,
  } = useFieldArray({ control, name: "owners" });

  const {
    fields: documentFields,
    append: appendDocument,
    remove: removeDocument,
  } = useFieldArray({ control, name: "documents" });

  const create = useMutation({
    mutationFn: (data: AgentInput & { status: "DRAFT" | "SUBMITTED" }) => agentApi.create(data, data.status),
    onSuccess: async (agent) => {
      localStorage.removeItem("agent-draft");
      await client.invalidateQueries({ queryKey: ["agents"] });
      await navigate(`/agents/${agent.id}`);
    },
    onError: () => {
      // error is shown below
    },
  });

  const onSubmit = (data: AgentInput) => {
    create.mutate({ ...data, status: submitAction });
  };

  const next = async () => {
    const fields = stepFields[step];
    const toValidate = (Array.isArray(fields) ? fields : [fields]) as (keyof AgentInput)[];
    const valid = await trigger(toValidate);
    if (valid) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const addOwner = () => appendOwner({ name: "", ownershipPercent: "", isBeneficialOwner: false });
  const addDocument = () => appendDocument({ documentType: "", fileName: "" });

  const country = countries.data?.items.find((c) => c.id === countryId);

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <Controller
              name="legalBusinessName"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Legal business name" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
              )}
            />
            <Controller
              name="tradingName"
              control={control}
              render={({ field }) => <TextField {...field} value={field.value ?? ""} label="Trading name (optional)" />}
            />
            <Controller
              name="registrationNumber"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Registration number" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
              )}
            />
            <Controller
              name="taxIdentificationNumber"
              control={control}
              render={({ field }) => <TextField {...field} value={field.value ?? ""} label="Tax ID (optional)" />}
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <FormControl>
              <InputLabel>Country</InputLabel>
              <Controller
                name="countryId"
                control={control}
                render={({ field, fieldState }) => (
                  <Select {...field} label="Country" error={Boolean(fieldState.error)}>
                    <MenuItem value="">Select country</MenuItem>
                    {countries.data?.items.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
            <FormControl disabled={!countryId}>
              <InputLabel>Region</InputLabel>
              <Controller
                name="regionId"
                control={control}
                render={({ field }) => (
                  <Select {...field} value={field.value ?? ""} label="Region">
                    <MenuItem value="">No region</MenuItem>
                    {regions.data?.items.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
            <FormControl disabled={!countryId}>
              <InputLabel>City</InputLabel>
              <Controller
                name="cityId"
                control={control}
                render={({ field, fieldState }) => (
                  <Select {...field} label="City" error={Boolean(fieldState.error)}>
                    <MenuItem value="">Select city</MenuItem>
                    {cities.data?.items.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
            <Controller
              name="addressLine1"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Address line 1" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
              )}
            />
            <Controller
              name="addressLine2"
              control={control}
              render={({ field }) => <TextField {...field} value={field.value ?? ""} label="Address line 2 (optional)" />}
            />
            <Controller
              name="postalCode"
              control={control}
              render={({ field }) => <TextField {...field} value={field.value ?? ""} label="Postal code (optional)" />}
            />
            <Controller
              name="latitude"
              control={control}
              render={({ field }) => <TextField {...field} value={field.value ?? ""} label="Latitude (optional)" />}
            />
            <Controller
              name="longitude"
              control={control}
              render={({ field }) => <TextField {...field} value={field.value ?? ""} label="Longitude (optional)" />}
            />
            <Controller
              name="contactName"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Contact name" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
              )}
            />
            <Controller
              name="contactEmail"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Contact email" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
              )}
            />
            <Controller
              name="contactPhone"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Contact phone" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
              )}
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            {ownerFields.map((item, index) => (
              <Card key={item.id} sx={{ mb: 2, p: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" }, gap: 2, alignItems: "center" }}>
                  <Controller
                    name={`owners.${index}.name`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField {...field} label="Owner name" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                    )}
                  />
                  <Controller
                    name={`owners.${index}.ownershipPercent`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField {...field} label="Ownership %" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                    )}
                  />
                  <FormControlLabel
                    control={
                      <Controller
                        name={`owners.${index}.isBeneficialOwner`}
                        control={control}
                        render={({ field }) => <Checkbox {...field} checked={field.value} />}
                      />
                    }
                    label="Beneficial owner"
                  />
                </Box>
                <Button color="error" onClick={() => removeOwner(index)} sx={{ mt: 1 }}>
                  Remove
                </Button>
              </Card>
            ))}
            <Button variant="outlined" onClick={addOwner}>
              Add owner
            </Button>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <FormControl>
              <InputLabel>Supported services</InputLabel>
              <Controller
                name="supportedServices"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    {...field}
                    multiple
                    label="Supported services"
                    error={Boolean(fieldState.error)}
                    renderValue={(selected) => (selected as string[]).join(", ")}
                  >
                    {["CASH_PICKUP", "BANK_DEPOSIT", "WALLET_DEPOSIT"].map((s) => (
                      <MenuItem key={s} value={s}>
                        {s.replaceAll("_", " ")}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
            <Controller
              name="dailyPayoutLimit"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Daily payout limit" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
              )}
            />
            <Controller
              name="maximumCashExposure"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Maximum cash exposure" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
              )}
            />
            <Controller
              name="minimumLiquidityThreshold"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Minimum liquidity threshold" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
              )}
            />
            <Controller
              name="commissionPlanId"
              control={control}
              render={({ field }) => <TextField {...field} value={field.value ?? ""} label="Commission plan ID (optional)" />}
            />
            <FormControl>
              <InputLabel>Risk rating</InputLabel>
              <Controller
                name="riskRating"
                control={control}
                render={({ field }) => (
                  <Select {...field} value={field.value ?? ""} label="Risk rating">
                    <MenuItem value="">Select risk</MenuItem>
                    {["LOW", "MEDIUM", "HIGH"].map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Box>
        );
      case 4:
        return (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <Controller
              name="bank.accountName"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Account name" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
              )}
            />
            <Controller
              name="bank.accountNumber"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Account number" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
              )}
            />
            <Controller
              name="bank.bankName"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Bank name" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
              )}
            />
            <Controller
              name="bank.currencyCode"
              control={control}
              render={({ field, fieldState }) => (
                <TextField {...field} label="Currency code" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
              )}
            />
            <FormControlLabel
              control={<Controller name="bank.isPrimary" control={control} render={({ field }) => <Checkbox {...field} checked={field.value} />} />}
              label="Primary settlement account"
            />
          </Box>
        );
      case 5:
        return (
          <Box>
            {documentFields.map((item, index) => (
              <Card key={item.id} sx={{ mb: 2, p: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" }, gap: 2, alignItems: "center" }}>
                  <FormControl>
                    <InputLabel>Document type</InputLabel>
                    <Controller
                      name={`documents.${index}.documentType`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <Select {...field} value={field.value ?? ""} label="Document type" error={Boolean(fieldState.error)}>
                          <MenuItem value="">Select type</MenuItem>
                          {documentTypes.map((t) => (
                            <MenuItem key={t} value={t}>
                              {t}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                  </FormControl>
                  <Controller
                    name={`documents.${index}.fileName`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField {...field} label="File name" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />
                    )}
                  />
                </Box>
                <Button color="error" onClick={() => removeDocument(index)} sx={{ mt: 1 }}>
                  Remove
                </Button>
              </Card>
            ))}
            <Button variant="outlined" onClick={addDocument}>
              Add document
            </Button>
          </Box>
        );
      case 6:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Review
            </Typography>
            <Card sx={{ p: 2, mb: 2 }}>
              <Typography>
                <b>Business:</b> {values.legalBusinessName} ({values.registrationNumber})
              </Typography>
              <Typography>
                <b>Location:</b> {values.addressLine1}, {country?.name || values.countryId} · {values.cityId}
              </Typography>
              <Typography>
                <b>Contact:</b> {values.contactName} · {values.contactEmail} · {values.contactPhone}
              </Typography>
              <Typography>
                <b>Services:</b> {values.supportedServices.join(" · ")}
              </Typography>
              <Typography>
                <b>Limits:</b> daily {formatMoney(values.dailyPayoutLimit, country?.defaultCurrencyCode || "XOF")}, exposure{" "}
                {formatMoney(values.maximumCashExposure, country?.defaultCurrencyCode || "XOF")}, liquidity{" "}
                {formatMoney(values.minimumLiquidityThreshold, country?.defaultCurrencyCode || "XOF")}
              </Typography>
              <Typography>
                <b>Bank:</b> {values.bank.bankName} / {values.bank.accountNumber} ({values.bank.currencyCode})
              </Typography>
              <Typography>
                <b>Owners:</b> {values.owners.length} · <b>Documents:</b> {values.documents.length}
              </Typography>
            </Card>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography component="h1" variant="h1">
        Onboard agent
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Complete all steps to register a new remittance agent. Progress is saved automatically.
      </Typography>

      <Stepper activeStep={step} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {create.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {normalizeApiError(create.error).message}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ p: 2, mb: 2 }}>{renderStep()}</Card>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button variant="outlined" disabled={step === 0} onClick={back}>
            Back
          </Button>
          <Box sx={{ display: "flex", gap: 1 }}>
            {step < steps.length - 1 ? (
              <Button variant="contained" onClick={() => void next()}>
                Next
              </Button>
            ) : (
              <>
                <Button
                  type="submit"
                  variant="outlined"
                  startIcon={<Save size={16} />}
                  onClick={() => setSubmitAction("DRAFT")}
                  disabled={create.isPending}
                >
                  Save as draft
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Send size={16} />}
                  onClick={() => setSubmitAction("SUBMITTED")}
                  disabled={create.isPending}
                >
                  Submit application
                </Button>
              </>
            )}
          </Box>
        </Box>
      </form>
    </Box>
  );
}
