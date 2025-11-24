export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      _cropTableToSourceTable: {
        Row: {
          A: string
          B: string
        }
        Insert: {
          A: string
          B: string
        }
        Update: {
          A?: string
          B?: string
        }
        Relationships: [
          {
            foreignKeyName: "_CropTableToSourceTable_A_fkey"
            columns: ["A"]
            isOneToOne: false
            referencedRelation: "cropTable"
            referencedColumns: ["cropId"]
          },
          {
            foreignKeyName: "_CropTableToSourceTable_B_fkey"
            columns: ["B"]
            isOneToOne: false
            referencedRelation: "sourceTable"
            referencedColumns: ["sourceId"]
          },
        ]
      }
      _cropTableToSpeciesTable: {
        Row: {
          A: string
          B: string
        }
        Insert: {
          A: string
          B: string
        }
        Update: {
          A?: string
          B?: string
        }
        Relationships: [
          {
            foreignKeyName: "_CropTableToSpeciesTable_A_fkey"
            columns: ["A"]
            isOneToOne: false
            referencedRelation: "cropTable"
            referencedColumns: ["cropId"]
          },
          {
            foreignKeyName: "_CropTableToSpeciesTable_B_fkey"
            columns: ["B"]
            isOneToOne: false
            referencedRelation: "speciesTable"
            referencedColumns: ["speciesName"]
          },
        ]
      }
      _landTableToSourceTable: {
        Row: {
          A: string
          B: string
        }
        Insert: {
          A: string
          B: string
        }
        Update: {
          A?: string
          B?: string
        }
        Relationships: [
          {
            foreignKeyName: "_LandTableToSourceTable_A_fkey"
            columns: ["A"]
            isOneToOne: false
            referencedRelation: "landTable"
            referencedColumns: ["landId"]
          },
          {
            foreignKeyName: "_LandTableToSourceTable_B_fkey"
            columns: ["B"]
            isOneToOne: false
            referencedRelation: "sourceTable"
            referencedColumns: ["sourceId"]
          },
        ]
      }
      _organizationLocalTableToSourceTable: {
        Row: {
          A: string
          B: string
        }
        Insert: {
          A: string
          B: string
        }
        Update: {
          A?: string
          B?: string
        }
        Relationships: [
          {
            foreignKeyName: "_OrganizationLocalTableToSourceTable_A_fkey"
            columns: ["A"]
            isOneToOne: false
            referencedRelation: "organizationLocalTable"
            referencedColumns: ["organizationLocalId"]
          },
          {
            foreignKeyName: "_OrganizationLocalTableToSourceTable_B_fkey"
            columns: ["B"]
            isOneToOne: false
            referencedRelation: "sourceTable"
            referencedColumns: ["sourceId"]
          },
        ]
      }
      _plantingTableToSourceTable: {
        Row: {
          A: string
          B: string
        }
        Insert: {
          A: string
          B: string
        }
        Update: {
          A?: string
          B?: string
        }
        Relationships: [
          {
            foreignKeyName: "_PlantingTableToSourceTable_A_fkey"
            columns: ["A"]
            isOneToOne: false
            referencedRelation: "plantingTable"
            referencedColumns: ["plantingId"]
          },
          {
            foreignKeyName: "_PlantingTableToSourceTable_B_fkey"
            columns: ["B"]
            isOneToOne: false
            referencedRelation: "sourceTable"
            referencedColumns: ["sourceId"]
          },
        ]
      }
      _projectTableToSourceTable: {
        Row: {
          A: string
          B: string
        }
        Insert: {
          A: string
          B: string
        }
        Update: {
          A?: string
          B?: string
        }
        Relationships: [
          {
            foreignKeyName: "_ProjectTableToSourceTable_A_fkey"
            columns: ["A"]
            isOneToOne: false
            referencedRelation: "projectTable"
            referencedColumns: ["projectId"]
          },
          {
            foreignKeyName: "_ProjectTableToSourceTable_B_fkey"
            columns: ["B"]
            isOneToOne: false
            referencedRelation: "sourceTable"
            referencedColumns: ["sourceId"]
          },
        ]
      }
      cropTable: {
        Row: {
          createdAt: string | null
          cropId: string
          cropName: string
          cropNotes: string | null
          cropStock: string | null
          deleted: boolean | null
          editedBy: string | null
          lastEditedAt: string | null
          organizationLocalName: string | null
          projectId: string | null
          seedInfo: string | null
          speciesId: string | null
          speciesLocalName: string | null
        }
        Insert: {
          createdAt?: string | null
          cropId: string
          cropName: string
          cropNotes?: string | null
          cropStock?: string | null
          deleted?: boolean | null
          editedBy?: string | null
          lastEditedAt?: string | null
          organizationLocalName?: string | null
          projectId?: string | null
          seedInfo?: string | null
          speciesId?: string | null
          speciesLocalName?: string | null
        }
        Update: {
          createdAt?: string | null
          cropId?: string
          cropName?: string
          cropNotes?: string | null
          cropStock?: string | null
          deleted?: boolean | null
          editedBy?: string | null
          lastEditedAt?: string | null
          organizationLocalName?: string | null
          projectId?: string | null
          seedInfo?: string | null
          speciesId?: string | null
          speciesLocalName?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "CropTable_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projectTable"
            referencedColumns: ["projectId"]
          },
        ]
      }
      landTable: {
        Row: {
          createdAt: string | null
          deleted: boolean | null
          editedBy: string | null
          gpsLat: number | null
          gpsLon: number | null
          hectares: number | null
          landId: string
          landName: string
          landNotes: string | null
          lastEditedAt: string | null
          preparation: string | null
          projectId: string
          treatmentType: Database["public"]["Enums"]["TreatmentType"] | null
        }
        Insert: {
          createdAt?: string | null
          deleted?: boolean | null
          editedBy?: string | null
          gpsLat?: number | null
          gpsLon?: number | null
          hectares?: number | null
          landId: string
          landName: string
          landNotes?: string | null
          lastEditedAt?: string | null
          preparation?: string | null
          projectId: string
          treatmentType?: Database["public"]["Enums"]["TreatmentType"] | null
        }
        Update: {
          createdAt?: string | null
          deleted?: boolean | null
          editedBy?: string | null
          gpsLat?: number | null
          gpsLon?: number | null
          hectares?: number | null
          landId?: string
          landName?: string
          landNotes?: string | null
          lastEditedAt?: string | null
          preparation?: string | null
          projectId?: string
          treatmentType?: Database["public"]["Enums"]["TreatmentType"] | null
        }
        Relationships: [
          {
            foreignKeyName: "LandTable_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projectTable"
            referencedColumns: ["projectId"]
          },
        ]
      }
      organizationLocalTable: {
        Row: {
          address: string | null
          capacityPerYear: number | null
          contactEmail: string | null
          contactName: string | null
          contactPhone: string | null
          createdAt: string | null
          deleted: boolean | null
          editedBy: string | null
          gpsLat: number | null
          gpsLon: number | null
          lastEditedAt: string | null
          organizationLocalId: string
          organizationLocalName: string
          organizationMasterId: string | null
          organizationNotes: string | null
          polyId: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          capacityPerYear?: number | null
          contactEmail?: string | null
          contactName?: string | null
          contactPhone?: string | null
          createdAt?: string | null
          deleted?: boolean | null
          editedBy?: string | null
          gpsLat?: number | null
          gpsLon?: number | null
          lastEditedAt?: string | null
          organizationLocalId: string
          organizationLocalName: string
          organizationMasterId?: string | null
          organizationNotes?: string | null
          polyId?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          capacityPerYear?: number | null
          contactEmail?: string | null
          contactName?: string | null
          contactPhone?: string | null
          createdAt?: string | null
          deleted?: boolean | null
          editedBy?: string | null
          gpsLat?: number | null
          gpsLon?: number | null
          lastEditedAt?: string | null
          organizationLocalId?: string
          organizationLocalName?: string
          organizationMasterId?: string | null
          organizationNotes?: string | null
          polyId?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "OrganizationLocalTable_organizationMasterId_fkey"
            columns: ["organizationMasterId"]
            isOneToOne: false
            referencedRelation: "organizationMasterTable"
            referencedColumns: ["organizationMasterId"]
          },
        ]
      }
      organizationMasterTable: {
        Row: {
          createdAt: string | null
          editedBy: string | null
          lastEditedAt: string | null
          officialWebsite: string | null
          organizationMasterId: string
          organizationMasterName: string
        }
        Insert: {
          createdAt?: string | null
          editedBy?: string | null
          lastEditedAt?: string | null
          officialWebsite?: string | null
          organizationMasterId: string
          organizationMasterName: string
        }
        Update: {
          createdAt?: string | null
          editedBy?: string | null
          lastEditedAt?: string | null
          officialWebsite?: string | null
          organizationMasterId?: string
          organizationMasterName?: string
        }
        Relationships: []
      }
      plantingTable: {
        Row: {
          allocated: number | null
          createdAt: string | null
          currency: string | null
          deleted: boolean | null
          lastEditedAt: string | null
          parentId: string
          parentType: Database["public"]["Enums"]["ParentType"]
          planted: number | null
          plantingDate: string | null
          plantingId: string
          pricePerUnit: number | null
          projectId: string
          units: number | null
          unitType: Database["public"]["Enums"]["UnitType"] | null
        }
        Insert: {
          allocated?: number | null
          createdAt?: string | null
          currency?: string | null
          deleted?: boolean | null
          lastEditedAt?: string | null
          parentId: string
          parentType: Database["public"]["Enums"]["ParentType"]
          planted?: number | null
          plantingDate?: string | null
          plantingId: string
          pricePerUnit?: number | null
          projectId: string
          units?: number | null
          unitType?: Database["public"]["Enums"]["UnitType"] | null
        }
        Update: {
          allocated?: number | null
          createdAt?: string | null
          currency?: string | null
          deleted?: boolean | null
          lastEditedAt?: string | null
          parentId?: string
          parentType?: Database["public"]["Enums"]["ParentType"]
          planted?: number | null
          plantingDate?: string | null
          plantingId?: string
          pricePerUnit?: number | null
          projectId?: string
          units?: number | null
          unitType?: Database["public"]["Enums"]["UnitType"] | null
        }
        Relationships: [
          {
            foreignKeyName: "PlantingTable_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projectTable"
            referencedColumns: ["projectId"]
          },
        ]
      }
      polygonTable: {
        Row: {
          coordinates: string | null
          geometry: string | null
          landId: string
          landName: string | null
          lastEditedAt: string | null
          polygonId: string
          polygonNotes: string | null
          type: string | null
        }
        Insert: {
          coordinates?: string | null
          geometry?: string | null
          landId: string
          landName?: string | null
          lastEditedAt?: string | null
          polygonId: string
          polygonNotes?: string | null
          type?: string | null
        }
        Update: {
          coordinates?: string | null
          geometry?: string | null
          landId?: string
          landName?: string | null
          lastEditedAt?: string | null
          polygonId?: string
          polygonNotes?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "PolygonTable_landId_fkey"
            columns: ["landId"]
            isOneToOne: false
            referencedRelation: "landTable"
            referencedColumns: ["landId"]
          },
        ]
      }
      polyTable: {
        Row: {
          createdAt: string | null
          deleted: boolean | null
          editedBy: string | null
          lastEditedAt: string | null
          liabilityCause: string | null
          motivation: string | null
          parentId: string
          parentType: Database["public"]["Enums"]["ParentType"]
          polyId: string
          projectId: string
          randomJson: string | null
          ratePerTree: number | null
          restorationType: Database["public"]["Enums"]["RestorationType"] | null
          reviews: string | null
          survivalRate: number | null
        }
        Insert: {
          createdAt?: string | null
          deleted?: boolean | null
          editedBy?: string | null
          lastEditedAt?: string | null
          liabilityCause?: string | null
          motivation?: string | null
          parentId: string
          parentType: Database["public"]["Enums"]["ParentType"]
          polyId: string
          projectId: string
          randomJson?: string | null
          ratePerTree?: number | null
          restorationType?:
            | Database["public"]["Enums"]["RestorationType"]
            | null
          reviews?: string | null
          survivalRate?: number | null
        }
        Update: {
          createdAt?: string | null
          deleted?: boolean | null
          editedBy?: string | null
          lastEditedAt?: string | null
          liabilityCause?: string | null
          motivation?: string | null
          parentId?: string
          parentType?: Database["public"]["Enums"]["ParentType"]
          polyId?: string
          projectId?: string
          randomJson?: string | null
          ratePerTree?: number | null
          restorationType?:
            | Database["public"]["Enums"]["RestorationType"]
            | null
          reviews?: string | null
          survivalRate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "PolyTable_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projectTable"
            referencedColumns: ["projectId"]
          },
        ]
      }
      projectTable: {
        Row: {
          carbonRegistry: Database["public"]["Enums"]["CarbonRegistry"] | null
          carbonRegistryType:
            | Database["public"]["Enums"]["CarbonRegistryType"]
            | null
          createdAt: string | null
          deleted: boolean | null
          employmentClaim: number | null
          employmentClaimDescription: string | null
          lastEditedAt: string | null
          platform: string | null
          platformId: string | null
          projectDateEnd: string | null
          projectDateStart: string | null
          projectId: string
          projectName: string
          projectNotes: string | null
          registryId: string | null
          url: string | null
        }
        Insert: {
          carbonRegistry?: Database["public"]["Enums"]["CarbonRegistry"] | null
          carbonRegistryType?:
            | Database["public"]["Enums"]["CarbonRegistryType"]
            | null
          createdAt?: string | null
          deleted?: boolean | null
          employmentClaim?: number | null
          employmentClaimDescription?: string | null
          lastEditedAt?: string | null
          platform?: string | null
          platformId?: string | null
          projectDateEnd?: string | null
          projectDateStart?: string | null
          projectId: string
          projectName: string
          projectNotes?: string | null
          registryId?: string | null
          url?: string | null
        }
        Update: {
          carbonRegistry?: Database["public"]["Enums"]["CarbonRegistry"] | null
          carbonRegistryType?:
            | Database["public"]["Enums"]["CarbonRegistryType"]
            | null
          createdAt?: string | null
          deleted?: boolean | null
          employmentClaim?: number | null
          employmentClaimDescription?: string | null
          lastEditedAt?: string | null
          platform?: string | null
          platformId?: string | null
          projectDateEnd?: string | null
          projectDateStart?: string | null
          projectId?: string
          projectName?: string
          projectNotes?: string | null
          registryId?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ProjectTable_platform_fkey"
            columns: ["platform"]
            isOneToOne: false
            referencedRelation: "organizationLocalTable"
            referencedColumns: ["organizationLocalName"]
          },
        ]
      }
      sourceTable: {
        Row: {
          createdAt: string | null
          disclosureType: Database["public"]["Enums"]["DisclosureType"] | null
          lastEditedAt: string | null
          parentId: string | null
          parentType: Database["public"]["Enums"]["ParentType"] | null
          projectId: string | null
          sourceCredit: string | null
          sourceDescription: string | null
          sourceId: string
          url: string
          urlType: Database["public"]["Enums"]["UrlType"] | null
        }
        Insert: {
          createdAt?: string | null
          disclosureType?: Database["public"]["Enums"]["DisclosureType"] | null
          lastEditedAt?: string | null
          parentId?: string | null
          parentType?: Database["public"]["Enums"]["ParentType"] | null
          projectId?: string | null
          sourceCredit?: string | null
          sourceDescription?: string | null
          sourceId: string
          url: string
          urlType?: Database["public"]["Enums"]["UrlType"] | null
        }
        Update: {
          createdAt?: string | null
          disclosureType?: Database["public"]["Enums"]["DisclosureType"] | null
          lastEditedAt?: string | null
          parentId?: string | null
          parentType?: Database["public"]["Enums"]["ParentType"] | null
          projectId?: string | null
          sourceCredit?: string | null
          sourceDescription?: string | null
          sourceId?: string
          url?: string
          urlType?: Database["public"]["Enums"]["UrlType"] | null
        }
        Relationships: []
      }
      speciesTable: {
        Row: {
          commonName: string
          createdAt: string | null
          deleted: boolean | null
          editedBy: string | null
          family: string | null
          lastEditedAt: string | null
          reference: string | null
          scientificName: string | null
          speciesName: string
          type: string | null
        }
        Insert: {
          commonName: string
          createdAt?: string | null
          deleted?: boolean | null
          editedBy?: string | null
          family?: string | null
          lastEditedAt?: string | null
          reference?: string | null
          scientificName?: string | null
          speciesName: string
          type?: string | null
        }
        Update: {
          commonName?: string
          createdAt?: string | null
          deleted?: boolean | null
          editedBy?: string | null
          family?: string | null
          lastEditedAt?: string | null
          reference?: string | null
          scientificName?: string | null
          speciesName?: string
          type?: string | null
        }
        Relationships: []
      }
      stakeholderTable: {
        Row: {
          createdAt: string | null
          lastEditedAt: string | null
          organizationLocalId: string
          parentId: string
          parentType: Database["public"]["Enums"]["ParentType"]
          projectId: string | null
          stakeholderId: string
          stakeholderType: Database["public"]["Enums"]["StakeholderType"] | null
        }
        Insert: {
          createdAt?: string | null
          lastEditedAt?: string | null
          organizationLocalId: string
          parentId: string
          parentType: Database["public"]["Enums"]["ParentType"]
          projectId?: string | null
          stakeholderId: string
          stakeholderType?:
            | Database["public"]["Enums"]["StakeholderType"]
            | null
        }
        Update: {
          createdAt?: string | null
          lastEditedAt?: string | null
          organizationLocalId?: string
          parentId?: string
          parentType?: Database["public"]["Enums"]["ParentType"]
          projectId?: string | null
          stakeholderId?: string
          stakeholderType?:
            | Database["public"]["Enums"]["StakeholderType"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "StakeholderTable_organizationLocalId_fkey"
            columns: ["organizationLocalId"]
            isOneToOne: false
            referencedRelation: "organizationLocalTable"
            referencedColumns: ["organizationLocalId"]
          },
          {
            foreignKeyName: "StakeholderTable_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projectTable"
            referencedColumns: ["projectId"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      CarbonRegistry:
        | "Verra"
        | "Gold_Standard"
        | "Climate_Action_Reserve"
        | "American_Carbon_Registry"
        | "Plan_Vivo"
        | "Social_Carbon"
      CarbonRegistryType: "ARR" | "AD" | "IFM"
      DisclosureType:
        | "publicDB"
        | "company"
        | "NGO"
        | "marketplace"
        | "disclosure"
        | "research"
      GeometryType:
        | "Polygon"
        | "MultiPolygon"
        | "MultiLineString"
        | "LineString"
        | "Point"
        | "Feature"
        | "FeatureCollection"
        | "GeometryCollection"
      ParentType:
        | "projectTable"
        | "landTable"
        | "cropTable"
        | "plantingTable"
        | "organizationTable"
        | "sourceTable"
        | "stakeholderTable"
      RestorationType:
        | "manual_planting"
        | "drone_seeding"
        | "mechanical_planting"
        | "aerial_seeding"
        | "natural_regeneration"
        | "conservation"
        | "improved_forest_management"
        | "avoided_deforestation"
        | "magrove_regeneration"
        | "agroforestry"
      StakeholderType:
        | "developer"
        | "nursery"
        | "marketplace"
        | "NGO"
        | "research"
        | "supplier"
        | "producer"
      TreatmentType:
        | "ARR"
        | "improved_forest_management"
        | "avoided_deforestation"
        | "forest_conservation"
        | "regenerative_agriculture"
        | "improved_agricultural_practices"
        | "cover_cropping"
        | "restoration"
        | "agroforestry"
      UnitType:
        | "cCO2e"
        | "hectare"
        | "acre"
        | "tree"
        | "credits"
        | "project"
        | "land"
      UrlType:
        | "webpage"
        | "api"
        | "image"
        | "video"
        | "document"
        | "review"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      CarbonRegistry: [
        "Verra",
        "Gold_Standard",
        "Climate_Action_Reserve",
        "American_Carbon_Registry",
        "Plan_Vivo",
        "Social_Carbon",
      ],
      CarbonRegistryType: ["ARR", "AD", "IFM"],
      DisclosureType: [
        "publicDB",
        "company",
        "NGO",
        "marketplace",
        "disclosure",
        "research",
      ],
      GeometryType: [
        "Polygon",
        "MultiPolygon",
        "MultiLineString",
        "LineString",
        "Point",
        "Feature",
        "FeatureCollection",
        "GeometryCollection",
      ],
      ParentType: [
        "projectTable",
        "landTable",
        "cropTable",
        "plantingTable",
        "organizationTable",
        "sourceTable",
        "stakeholderTable",
      ],
      RestorationType: [
        "manual_planting",
        "drone_seeding",
        "mechanical_planting",
        "aerial_seeding",
        "natural_regeneration",
        "conservation",
        "improved_forest_management",
        "avoided_deforestation",
        "magrove_regeneration",
        "agroforestry",
      ],
      StakeholderType: [
        "developer",
        "nursery",
        "marketplace",
        "NGO",
        "research",
        "supplier",
        "producer",
      ],
      TreatmentType: [
        "ARR",
        "improved_forest_management",
        "avoided_deforestation",
        "forest_conservation",
        "regenerative_agriculture",
        "improved_agricultural_practices",
        "cover_cropping",
        "restoration",
        "agroforestry",
      ],
      UnitType: [
        "cCO2e",
        "hectare",
        "acre",
        "tree",
        "credits",
        "project",
        "land",
      ],
      UrlType: [
        "webpage",
        "api",
        "image",
        "video",
        "document",
        "review",
        "other",
      ],
    },
  },
} as const
